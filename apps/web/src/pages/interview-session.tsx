import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import {
  Mic, MicOff, Loader2, Square, Volume2, Clock, MessageSquare,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getInterview,
  submitInterviewAnswer,
  abandonInterview,
  transcribeAudioBlob,
  type InterviewDetails,
  type InterviewReport,
} from "@/lib/interview-api";
import { createSTT } from "@/lib/voice/stt";
import { createTTS } from "@/lib/voice/tts";
import { INTERVIEW_MAX_DURATION_MS } from "@/lib/interview-config-shared";
import { InterviewReportView } from "@/components/interview/interview-report-view";
import { cn } from "@/lib/utils";

const tts = createTTS();

export default function InterviewSession() {
  const params = useParams<{ id: string }>();
  const interviewId = params.id;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [listening, setListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const sttRef = useRef<ReturnType<typeof createSTT> | null>(null);
  const spokenQuestionRef = useRef<string>("");

  const loadInterview = useCallback(async () => {
    if (!interviewId) return;
    const data = await getInterview(interviewId);
    setInterview(data);
    if (data.report) {
      setReport(data.report);
    } else if (data.status === "in_progress" && data.activeQuestionText) {
      setCurrentQuestion(data.activeQuestionText);
    }
    setLoading(false);
  }, [interviewId]);

  useEffect(() => {
    void loadInterview().catch(() => {
      toast({ title: "Interview not found", variant: "destructive" });
      setLoading(false);
    });
  }, [loadInterview, toast]);

  useEffect(() => {
    if (!interview?.startedAt || interview.status !== "in_progress") return;
    const start = new Date(interview.startedAt).getTime();
    const tick = () => setElapsedMs(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [interview?.startedAt, interview?.status]);

  const speakQuestion = useCallback(async (text: string) => {
    if (!text || spokenQuestionRef.current === text) return;
    spokenQuestionRef.current = text;
    setSpeaking(true);
    try {
      await tts.speak(text, { rate: 0.95 });
    } catch {
      /* user may have blocked audio */
    } finally {
      setSpeaking(false);
    }
  }, []);

  useEffect(() => {
    if (currentQuestion && interview?.status === "in_progress") {
      void speakQuestion(currentQuestion);
    }
  }, [currentQuestion, interview?.status, speakQuestion]);

  function startListening() {
    tts.cancel();
    setAnswerText("");
    const session = createSTT(
      { transcribeBlob: transcribeAudioBlob },
      {
        onResult: (r) => setAnswerText((prev) => (r.isFinal ? r.text : r.text || prev)),
        onError: (err) => {
          toast({ title: "Speech recognition error", description: err.message, variant: "destructive" });
          setListening(false);
        },
        onEnd: () => setListening(false),
      },
    );
    sttRef.current = session;
    if (!session.isSupported()) {
      toast({
        title: "Voice not supported",
        description: "Type your answer below or use Chrome/Edge for voice input.",
        variant: "destructive",
      });
      return;
    }
    setListening(true);
    session.start();
  }

  function stopListening() {
    sttRef.current?.stop();
    sttRef.current = null;
    setListening(false);
  }

  async function handleSubmit() {
    if (!interviewId || !answerText.trim()) return;
    stopListening();
    setSubmitting(true);
    try {
      const result = await submitInterviewAnswer(interviewId, answerText.trim());
      setAnswerText("");
      spokenQuestionRef.current = "";

      if (result.status === "completed") {
        setInterview((prev) => (prev ? { ...prev, ...result.interview, status: "completed" } : prev));
        if (result.report) setReport(result.report);
        else await loadInterview();
      } else if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        setInterview((prev) =>
          prev ? { ...prev, ...result.interview, turnCount: result.interview.turnCount } : prev,
        );
      }
    } catch (err) {
      toast({
        title: "Could not submit answer",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEndEarly() {
    if (!interviewId) return;
    stopListening();
    try {
      await abandonInterview(interviewId);
      toast({ title: "Interview ended" });
      setInterview((prev) => (prev ? { ...prev, status: "abandoned" } : prev));
    } catch {
      toast({ title: "Could not end interview", variant: "destructive" });
    }
  }

  const remainingMs = interview?.startedAt
    ? Math.max(0, INTERVIEW_MAX_DURATION_MS - elapsedMs)
    : INTERVIEW_MAX_DURATION_MS;
  const remainingMin = Math.ceil(remainingMs / 60_000);

  if (loading) {
    return (
      <AppShell title="Mock Interview">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!interview) {
    return (
      <AppShell title="Mock Interview">
        <p className="text-center text-muted-foreground py-20">Interview not found.</p>
      </AppShell>
    );
  }

  if (report || interview.status === "completed") {
    return (
      <AppShell title="Mock Interview">
        <InterviewReportView
          report={report ?? interview.report!}
          interview={interview}
        />
      </AppShell>
    );
  }

  if (interview.status === "abandoned") {
    return (
      <AppShell title="Mock Interview">
        <div className="max-w-lg mx-auto text-center py-16 space-y-4">
          <p className="text-muted-foreground">This interview was ended early.</p>
          <Link href="/interview/history">
            <Button>View history</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const questionNum = interview.turnCount + 1;
  const totalPlanned = interview.plannedQuestions.length;

  return (
    <AppShell title="Mock Interview">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2 capitalize">
              {interview.interviewType} · {interview.targetRole ?? "General"}
            </Badge>
            <h1 className="text-xl font-bold">Mock Interview</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {remainingMin}m left
            </span>
            <span>
              Q {questionNum}/{totalPlanned}+
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Interviewer {speaking && "· Speaking…"}
              </p>
              <p className="text-base leading-relaxed font-medium">{currentQuestion}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => {
              spokenQuestionRef.current = "";
              void speakQuestion(currentQuestion);
            }}
            disabled={speaking}
          >
            <Volume2 className="h-4 w-4" /> Replay question
          </Button>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Your answer</label>
          <Textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Speak or type your answer…"
            rows={5}
            className="resize-none"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={listening ? "destructive" : "outline"}
              onClick={listening ? stopListening : startListening}
              className="gap-2"
            >
              {listening ? (
                <>
                  <MicOff className="h-4 w-4" /> Stop recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" /> Answer out loud
                </>
              )}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!answerText.trim() || submitting}
              className="gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit answer
            </Button>
            <Button variant="ghost" onClick={handleEndEarly} className="gap-2 text-muted-foreground">
              <Square className="h-4 w-4" /> End early
            </Button>
          </div>
          {listening && (
            <p className={cn("text-xs text-primary animate-pulse")}>Listening… speak clearly</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
