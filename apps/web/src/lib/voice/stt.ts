/** Speech-to-text provider abstraction — swap browser vs server Whisper without rewriting callers. */

export interface STTResult {
  text: string;
  isFinal: boolean;
}

export interface STTCallbacks {
  onResult: (result: STTResult) => void;
  onError: (error: Error) => void;
  onEnd?: () => void;
}

export interface STTSession {
  start: () => void;
  stop: () => void;
  isSupported: () => boolean;
  provider: "browser" | "whisper";
}

export interface STTOptions {
  language?: string;
  /** Server-side Whisper fallback — receives recorded audio blob. */
  transcribeBlob?: (blob: Blob) => Promise<string>;
}

/** Minimal browser SpeechRecognition typing (not in all TS lib configs). */
interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
  }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isBrowserSTTSupported(): boolean {
  return getSpeechRecognition() != null;
}

export function createSTTSession(options: STTOptions, callbacks: STTCallbacks): STTSession {
  const Recognition = getSpeechRecognition();
  if (Recognition) {
    return createBrowserSTT(Recognition, options, callbacks);
  }
  return createWhisperFallbackSTT(options, callbacks);
}

/** Alias for callers expecting createSTT. */
export const createSTT = createSTTSession;

function createBrowserSTT(
  Recognition: SpeechRecognitionCtor,
  options: STTOptions,
  callbacks: STTCallbacks,
): STTSession {
  let recognition: BrowserSpeechRecognition | null = null;

  return {
    provider: "browser",
    isSupported: () => true,
    start: () => {
      recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = options.language ?? "en-US";

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        const text = (final || interim).trim();
        if (text) {
          callbacks.onResult({ text, isFinal: !!final });
        }
      };

      recognition.onerror = (event) => {
        callbacks.onError(new Error(event.error || "Speech recognition failed"));
      };

      recognition.onend = () => callbacks.onEnd?.();

      recognition.start();
    },
    stop: () => {
      recognition?.stop();
      recognition = null;
    },
  };
}

function createWhisperFallbackSTT(options: STTOptions, callbacks: STTCallbacks): STTSession {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  return {
    provider: "whisper",
    isSupported: () =>
      typeof MediaRecorder !== "undefined" && !!options.transcribeBlob,
    start: () => {
      chunks = [];
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            if (!options.transcribeBlob || chunks.length === 0) {
              callbacks.onEnd?.();
              return;
            }
            try {
              const blob = new Blob(chunks, { type: "audio/webm" });
              const text = await options.transcribeBlob(blob);
              callbacks.onResult({ text, isFinal: true });
            } catch (err) {
              callbacks.onError(err instanceof Error ? err : new Error(String(err)));
            } finally {
              callbacks.onEnd?.();
            }
          };
          mediaRecorder.start();
        })
        .catch((err) => callbacks.onError(err instanceof Error ? err : new Error(String(err))));
    },
    stop: () => {
      if (mediaRecorder?.state !== "inactive") {
        mediaRecorder?.stop();
      }
      mediaRecorder = null;
    },
  };
}
