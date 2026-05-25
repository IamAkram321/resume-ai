import { useState, useRef } from "react";
import { Link } from "wouter";
import { Brain, Upload, FileText, X, Loader2, BarChart3, Crown, LogOut, Mail, MessageSquare, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCreateAnalysis, useGetMyUsage, getListAnalysesQueryKey, getGetAnalysisStatsQueryKey, getGetMyUsageQueryKey } from "@resume-ai/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser, useClerk } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";
import { extractText } from "@/lib/pdf";
import { ThemeToggle } from "@/components/theme-toggle";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: { issue: string; before: string; after: string }[];
  atsKeywords: string[];
}

interface Analysis {
  id: string;
  score: number;
  result: AnalysisResult;
}

interface InterviewQuestion {
  category: string;
  question: string;
  tip: string;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center" data-testid="score-circle">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(240 6% 14%)" strokeWidth="8" />
        <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div className="absolute" style={{ marginTop: "-76px" }}>
        <div className="text-4xl font-extrabold" style={{ color }} data-testid="score-value">{score}</div>
        <div className="text-xs text-muted-foreground text-center mt-0.5">/ 100</div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Behavioral: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Technical: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Situational: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "Role-Specific": "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function Analyze() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
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
        toast({ title: "Analysis complete", description: `Score: ${(data as any).score}/100` });
      },
      onError: (err: any) => {
        const msg = err?.data?.error ?? "Analysis failed. Please try again.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const handleFile = async (file: File) => {
    try {
      const text = await extractText(file);
      setResumeText(text);
      setFileName(file.name);
      setCharCount(text.length);
    } catch {
      toast({ title: "Failed to read file", description: "Please try a different file.", variant: "destructive" });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (!resumeText.trim() || !jobDescription.trim()) return;
    analyze.mutate({ data: { resumeText, jobDescription } });
  };

  const handleReset = () => {
    setResult(null);
    setCoverLetter(null);
    setInterviewQuestions(null);
    setResumeText("");
    setJobDescription("");
    setFileName(null);
    setCharCount(0);
  };

  const generateCoverLetter = async () => {
    if (!resumeText || !jobDescription) return;
    setCoverLetterLoading(true);
    try {
      const res = await fetch(`${basePath}/api/generate/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCoverLetter(data.coverLetter);
    } catch (err: any) {
      toast({ title: "Cover letter failed", description: err.message, variant: "destructive" });
    } finally {
      setCoverLetterLoading(false);
    }
  };

  const generateInterviewPrep = async () => {
    if (!resumeText || !jobDescription) return;
    setInterviewLoading(true);
    try {
      const res = await fetch(`${basePath}/api/generate/interview-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setInterviewQuestions(data.questions);
    } catch (err: any) {
      toast({ title: "Interview prep failed", description: err.message, variant: "destructive" });
    } finally {
      setInterviewLoading(false);
    }
  };

  const analysisResult = result?.result;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-60 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed top-0 left-0">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">ResumeAI</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground text-sm transition-colors cursor-pointer">
              <BarChart3 className="w-4 h-4" />Dashboard
            </div>
          </Link>
          <Link href="/analyze">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-foreground text-sm font-medium cursor-pointer">
              <FileText className="w-4 h-4" />Analyze Resume
            </div>
          </Link>
          <Link href="/billing">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground text-sm transition-colors cursor-pointer">
              <Crown className="w-4 h-4" />Billing
            </div>
          </Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.firstName?.[0] ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.firstName ?? "User"}</div>
              <Badge variant="secondary" className="text-xs mt-0.5">{isPro ? "Pro" : "Free"}</Badge>
            </div>
            <ThemeToggle />
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => signOut({ redirectUrl: basePath || "/" })}>
            <LogOut className="w-4 h-4" />Sign out
          </Button>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Analyze Resume</h1>
            <p className="text-muted-foreground text-sm mt-1">Upload your resume and paste the job description to get AI feedback.</p>
          </div>

          {!isPro && usage && (
            <div className="bg-card border border-card-border rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{usage.used} / {usage.limit}</span>
                <span className="text-muted-foreground"> analyses used today</span>
              </div>
              <Link href="/billing">
                <Button size="sm" variant="ghost" className="text-primary text-xs gap-1">
                  <Crown className="w-3 h-3" />Upgrade for unlimited
                </Button>
              </Link>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Input */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Resume</label>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {fileName ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-6 h-6 text-primary" />
                      <div className="text-left">
                        <div className="font-medium text-sm">{fileName}</div>
                        <div className="text-xs text-muted-foreground">{charCount.toLocaleString()} characters extracted</div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-2" onClick={e => { e.stopPropagation(); setFileName(null); setResumeText(""); setCharCount(0); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <div className="font-medium text-sm mb-1">Drop your resume here</div>
                      <div className="text-xs text-muted-foreground">PDF or .txt — max 10MB</div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Job Description</label>
                <Textarea
                  placeholder="Paste the job description here..."
                  className="min-h-48 resize-none"
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                />
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                disabled={!resumeText.trim() || !jobDescription.trim() || analyze.isPending}
                onClick={handleSubmit}
              >
                {analyze.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />AI is reviewing your resume...</>
                ) : (
                  "Analyze Resume"
                )}
              </Button>

              {/* Quick actions after analysis */}
              {result && (
                <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Generate more with AI</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 justify-start"
                      disabled={coverLetterLoading}
                      onClick={generateCoverLetter}
                    >
                      {coverLetterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      Cover Letter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 justify-start"
                      disabled={interviewLoading}
                      onClick={generateInterviewPrep}
                    >
                      {interviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      Interview Prep
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Results */}
            <div>
              {!analysisResult ? (
                <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-96">
                  <BarChart3 className="w-10 h-10 mb-3 text-muted-foreground/50" />
                  <div className="font-medium mb-1">Results will appear here</div>
                  <div className="text-sm">Fill in both fields and click Analyze Resume</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-card border border-card-border rounded-xl p-6 space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="relative flex items-center justify-center">
                        <ScoreCircle score={analysisResult.score} />
                      </div>
                      <div>
                        <div className="text-lg font-semibold">
                          {analysisResult.score >= 75 ? "Strong match" : analysisResult.score >= 50 ? "Moderate match" : "Needs work"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {analysisResult.atsKeywords.length > 0 && `${analysisResult.atsKeywords.length} missing keywords`}
                        </div>
                      </div>
                    </div>

                    <Tabs defaultValue="overview">
                      <TabsList className="w-full">
                        <TabsTrigger value="overview" className="flex-1 text-xs">Overview</TabsTrigger>
                        <TabsTrigger value="strengths" className="flex-1 text-xs">Strengths</TabsTrigger>
                        <TabsTrigger value="weaknesses" className="flex-1 text-xs">Weaknesses</TabsTrigger>
                        <TabsTrigger value="suggestions" className="flex-1 text-xs">Rewrites</TabsTrigger>
                      </TabsList>
                      <TabsContent value="overview" className="mt-4 space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{analysisResult.summary}</p>
                        {analysisResult.atsKeywords.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Missing ATS Keywords</div>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.atsKeywords.map(k => <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>)}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="strengths" className="mt-4">
                        <ul className="space-y-2">
                          {analysisResult.strengths.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-chart-2 font-bold mt-0.5">+</span><span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="weaknesses" className="mt-4">
                        <ul className="space-y-2">
                          {analysisResult.weaknesses.map((w, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-destructive font-bold mt-0.5">-</span><span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="suggestions" className="mt-4 space-y-4">
                        {analysisResult.suggestions.map((s, i) => (
                          <div key={i} className="bg-muted/30 rounded-lg p-4 space-y-2">
                            <div className="font-medium text-sm">{s.issue}</div>
                            <div className="text-xs text-muted-foreground line-through">{s.before}</div>
                            <div className="text-xs text-chart-2">{s.after}</div>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>

                    <Button variant="outline" className="w-full" onClick={handleReset}>
                      Analyze Another
                    </Button>
                  </div>

                  {/* Cover Letter */}
                  {coverLetter && (
                    <div className="bg-card border border-card-border rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-sm">Cover Letter</span>
                        </div>
                        <CopyButton text={coverLetter} />
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 rounded-lg p-4 max-h-80 overflow-y-auto">
                        {coverLetter}
                      </div>
                    </div>
                  )}

                  {/* Interview Prep */}
                  {interviewQuestions && interviewQuestions.length > 0 && (
                    <div className="bg-card border border-card-border rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">Interview Prep Questions</span>
                      </div>
                      <div className="space-y-3">
                        {interviewQuestions.map((q, i) => (
                          <div key={i} className="bg-muted/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <span className="text-xs font-bold text-primary mt-0.5 shrink-0">Q{i + 1}</span>
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${CATEGORY_COLORS[q.category] ?? "bg-muted text-muted-foreground border-border"}`}>
                                    {q.category}
                                  </span>
                                </div>
                                <div className="font-medium text-sm">{q.question}</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                  <span className="font-semibold text-primary/80">Tip: </span>{q.tip}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
