/** Text-to-speech provider abstraction — browser default, swappable via VITE_TTS_PROVIDER. */

export type TTSProvider = "browser" | "elevenlabs";

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  voiceName?: string;
}

export interface TTSSession {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  cancel: () => void;
  isSupported: () => boolean;
  provider: TTSProvider;
}

function resolveProvider(): TTSProvider {
  const env = (import.meta.env.VITE_TTS_PROVIDER as string | undefined)?.toLowerCase();
  if (env === "elevenlabs") return "elevenlabs";
  return "browser";
}

export function createTTS(): TTSSession {
  const provider = resolveProvider();
  if (provider === "elevenlabs") {
    return createElevenLabsTTS();
  }
  return createBrowserTTS();
}

function createBrowserTTS(): TTSSession {
  return {
    provider: "browser",
    isSupported: () => typeof window !== "undefined" && "speechSynthesis" in window,
    speak: (text, options) =>
      new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
          reject(new Error("Speech synthesis not supported"));
          return;
        }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = options?.rate ?? 1;
        utter.pitch = options?.pitch ?? 1;
        if (options?.voiceName) {
          const voice = window.speechSynthesis
            .getVoices()
            .find((v) => v.name.includes(options.voiceName!));
          if (voice) utter.voice = voice;
        }
        utter.onend = () => resolve();
        utter.onerror = (e) => reject(new Error(e.error || "TTS failed"));
        window.speechSynthesis.speak(utter);
      }),
    cancel: () => window.speechSynthesis?.cancel(),
  };
}

/** Placeholder for future ElevenLabs integration — falls back to browser if no API key. */
function createElevenLabsTTS(): TTSSession {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
  if (!apiKey) {
    return createBrowserTTS();
  }

  return {
    provider: "elevenlabs",
    isSupported: () => true,
    speak: async (text) => {
      const voiceId = (import.meta.env.VITE_ELEVENLABS_VOICE_ID as string) || "default";
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({ text, model_id: "eleven_monolingual_v1" }),
      });
      if (!res.ok) throw new Error("ElevenLabs TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => reject(new Error("Audio playback failed"));
        audio.play().catch(reject);
      });
    },
    cancel: () => {},
  };
}
