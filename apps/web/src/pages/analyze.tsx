import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import {
  Upload,
  FileText,
  X,
  Loader2,
  Mail,
  MessageSquare,
  Copy,
  Check,
  Crown,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateAnalysis,
  useGetMyUsage,
  getListAnalysesQueryKey,
  getGetAnalysisStatsQueryKey,
  getGetMyUsageQueryKey,
} from "@resume-ai/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { extractText } from "@/lib/pdf";
import { generateCoverLetter, generateInterviewPrep, type InterviewQuestion } from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { ScoreRing, scoreLabel } from "@/components/score-ring";
import { cn } from "@/lib/utils";
import { RejectionAnalysisPanel } from "@/components/analysis/rejection-analysis";
import type { AnalysisResult } from "@resume-ai/api-zod";

interface Analysis {
  id: string;
  score: number;
  result: AnalysisResult;
}

const CATEGORY_STYLES: Record<string, string> = {
  Behavioral: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Technical: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Situational: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Role-Specific": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export default function Analyze() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"upload" | "paste">("paste");
  const [result, setResult] = useState<Analysis | null>(null);

  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[] | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  const { data: usage } = useGetMyUsage();
  const isPro = usage?.isPro ?? false;

  const analyze = useCreateAnalysis({
    mutation: {
      onSuccess: (data) => {
        setResult(data as Analysis);
        setCoverLetter(null);
        setInterviewQuestions(null);
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyUsageQueryKey() });
        toast({ title: "Analysis complete", description: `Your match score is ${(data as Analysis).score}/100` });
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({
          title: "Analysis failed",
          description: err?.data?.error ?? "Please try again in a moment.",
          variant: "destructive",
        });
      },
    },
  });

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleFile = async (file: File) => {
    try {
      const text = await extractText(file);
      setResumeText(text);
      setFileName(file.name);
      setInputMode("upload");
    } catch {
      toast({ title: "Could not read file", description: "Try a PDF or plain text file.", variant: "destructive" });
    }
  };

  const canAnalyze =
    resumeText.trim().length >= 50 && jobDescription.trim().length >= 50 && !analyze.isPending;

  const handleSubmit = () => {
    if (!canAnalyze) return;
    analyze.mutate({ data: { resumeText: resumeText.trim(), jobDescription: jobDescription.trim() } });
  };

  const handleReset = () => {
    setResult(null);
    setCoverLetter(null);
    setInterviewQuestions(null);
    setResumeText("");
    setJobDescription("");
    setFileName(null);
    setInputMode("paste");
  };

  const runCoverLetter = async () => {
    if (!isPro) return;
    setCoverLetterLoading(true);
    try {
      const letter = await generateCoverLetter(resumeText.trim(), jobDescription.trim());
      setCoverLetter(letter);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast({ title: "Cover letter failed", description: msg, variant: "destructive" });
    } finally {
      setCoverLetterLoading(false);
    }
  };

  const runInterviewPrep = async () => {
    if (!isPro) return;
    setInterviewLoading(true);
    try {
      const questions = await generateInterviewPrep(resumeText.trim(), jobDescription.trim());
      setInterviewQuestions(questions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast({ title: "Interview prep failed", description: msg, variant: "destructive" });
    } finally {
      setInterviewLoading(false);
    }
  };

  const analysisResult = result?.result;

  return (
    <AppShell
      title="Analyze resume"
      description="Match your resume to any role and get actionable, ATS-aware feedback."
      isPro={isPro}
    >
      {!isPro && usage && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm">
            <span className="font-semibold tabular-nums">{usage.used}</span>
            <span className="text-muted-foreground"> / {usage.limit} analyses today</span>
          </p>
          <Link href="/billing">
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Crown className="h-3.5 w-3.5" />
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-5">
          <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <label className="text-sm font-semibold">Resume</label>
              <div className="flex rounded-lg border border-border p-0.5 text-xs">
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-3 py-1 font-medium transition-colors",
                    inputMode === "paste" && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => setInputMode("paste")}
                >
                  Paste
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-3 py-1 font-medium transition-colors",
                    inputMode === "upload" && "bg-primary text-primary-foreground",
                  )}
                  onClick={() => setInputMode("upload")}
                >
                  Upload
                </button>
              </div>
            </div>

            {inputMode === "paste" ? (
              <Textarea
                placeholder="Paste your full resume text here…"
                className="min-h-44 resize-y font-mono text-sm leading-relaxed"
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setFileName(null);
                }}
              />
            ) : (
              <div
                className="cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/30"
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {fileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {resumeText.length.toLocaleString()} characters
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName(null);
                        setResumeText("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop PDF or .txt</p>
                    <p className="mt-1 text-xs text-muted-foreground">Max 10MB</p>
                  </>
                )}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {resumeText.trim().length > 0
                ? `${resumeText.trim().length.toLocaleString()} characters`
                : "Minimum 50 characters required"}
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <label className="mb-3 block text-sm font-semibold">Job description</label>
            <Textarea
              placeholder="Paste the full job posting — requirements, responsibilities, and qualifications…"
              className="min-h-44 resize-y text-sm leading-relaxed"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <Button className="w-full gap-2 glow-ring" size="lg" disabled={!canAnalyze} onClick={handleSubmit}>
            {analyze.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing with AI…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run analysis
              </>
            )}
          </Button>
        </div>

        <div ref={resultsRef} className="min-h-[320px]">
          {analyze.isPending ? (
            <div className="glass-panel space-y-4 rounded-2xl p-6">
              <Skeleton className="h-32 w-32 rounded-full mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !analysisResult ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium">Your insights appear here</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Add resume and job description, then run analysis for score, rewrites, and keyword gaps.
              </p>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="glass-panel glow-ring rounded-2xl p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <ScoreRing score={analysisResult.score} size="lg" showLabel />
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-bold">{scoreLabel(analysisResult.score)}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {analysisResult.summary}
                    </p>
                    {analysisResult.atsKeywords.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {analysisResult.atsKeywords.length} missing ATS keywords identified
                      </p>
                    )}
                  </div>
                </div>

                {analysisResult.rejectionAnalysis && (
                  <div className="mt-6">
                    <RejectionAnalysisPanel data={analysisResult.rejectionAnalysis} />
                  </div>
                )}

                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="strengths">Strengths</TabsTrigger>
                    <TabsTrigger value="weaknesses">Gaps</TabsTrigger>
                    <TabsTrigger value="suggestions">Rewrites</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="mt-4 space-y-4">
                    {analysisResult.atsKeywords.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Missing keywords
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.atsKeywords.map((k) => (
                            <Badge key={k} variant="secondary">
                              {k}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="strengths" className="mt-4">
                    <ul className="space-y-2.5">
                      {analysisResult.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="font-bold text-chart-2">+</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                  <TabsContent value="weaknesses" className="mt-4">
                    <ul className="space-y-2.5">
                      {analysisResult.weaknesses.map((w, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="font-bold text-destructive">−</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                  <TabsContent value="suggestions" className="mt-4 space-y-3">
                    {analysisResult.suggestions.map((s, i) => (
                      <div key={i} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <p className="text-sm font-medium">{s.issue}</p>
                        <p className="mt-2 text-xs text-muted-foreground line-through">{s.before}</p>
                        <p className="mt-1 text-xs text-chart-2">{s.after}</p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                <Button variant="outline" className="mt-6 w-full" onClick={handleReset}>
                  Analyze another role
                </Button>
              </div>

              <div className="glass-panel rounded-2xl p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pro tools
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    disabled={!isPro || coverLetterLoading}
                    onClick={isPro ? runCoverLetter : undefined}
                  >
                    {!isPro ? <Lock className="h-4 w-4" /> : coverLetterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Cover letter
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    disabled={!isPro || interviewLoading}
                    onClick={isPro ? runInterviewPrep : undefined}
                  >
                    {!isPro ? <Lock className="h-4 w-4" /> : interviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    Interview prep
                  </Button>
                </div>
                {!isPro && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    <Link href="/billing" className="text-primary font-medium hover:underline">
                      Upgrade to Pro
                    </Link>{" "}
                    to unlock cover letters and interview questions.
                  </p>
                )}
              </div>

              {coverLetter && (
                <div className="glass-panel rounded-2xl p-6 animate-in fade-in duration-300">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Mail className="h-4 w-4 text-primary" />
                      Cover letter
                    </h3>
                    <CopyButton text={coverLetter} />
                  </div>
                  <div className="max-h-80 overflow-y-auto rounded-xl bg-muted/25 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {coverLetter}
                  </div>
                </div>
              )}

              {interviewQuestions && interviewQuestions.length > 0 && (
                <div className="glass-panel rounded-2xl p-6 animate-in fade-in duration-300">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Interview prep ({interviewQuestions.length} questions)
                  </h3>
                  <div className="space-y-3">
                    {interviewQuestions.map((q, i) => (
                      <div key={i} className="rounded-xl border border-border/50 bg-muted/15 p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-primary">Q{i + 1}</span>
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-xs font-medium",
                              CATEGORY_STYLES[q.category] ?? "bg-muted text-muted-foreground",
                            )}
                          >
                            {q.category}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{q.question}</p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground/80">Tip: </span>
                          {q.tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
