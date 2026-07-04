import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Mic, Upload, Loader2, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useListAnalyses, useGetMyUsage, getGetMyUsageQueryKey } from "@resume-ai/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FeatureQuotaBadge } from "@/components/usage/feature-quota";
import { extractTextFromPdf } from "@/lib/pdf";
import { startInterview, type InterviewType } from "@/lib/interview-api";
import { cn } from "@/lib/utils";

const INTERVIEW_TYPES: { value: InterviewType; label: string; desc: string }[] = [
  { value: "mixed", label: "Mixed", desc: "Technical + behavioral (recommended)" },
  { value: "technical", label: "Technical", desc: "Projects, stack, system design" },
  { value: "behavioral", label: "Behavioral", desc: "STAR stories, career narrative" },
];

export default function InterviewNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: analyses = [], isLoading: loadingAnalyses } = useListAnalyses();
  const { data: usage } = useGetMyUsage();

  const [mode, setMode] = useState<"existing" | "upload">("existing");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>("");
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("mixed");
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const mockQuota = usage?.features.find((f) => f.key === "mock_interview");

  async function handlePdfUpload(file: File) {
    setUploading(true);
    try {
      const text = await extractTextFromPdf(file);
      setResumeText(text);
      setMode("upload");
    } catch {
      toast({ title: "Could not read PDF", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleStart() {
    setStarting(true);
    try {
      const body =
        mode === "existing" && selectedAnalysisId
          ? { analysisId: selectedAnalysisId, targetRole: targetRole || undefined, interviewType }
          : { resumeText, targetRole: targetRole || undefined, interviewType };

      const { interview } = await startInterview(body);
      await qc.invalidateQueries({ queryKey: getGetMyUsageQueryKey() });
      setLocation(`/interview/${interview.id}`);
    } catch (err) {
      toast({
        title: "Could not start interview",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setStarting(false);
    }
  }

  const canStart =
    mode === "existing"
      ? !!selectedAnalysisId
      : resumeText.trim().length >= 50;

  return (
    <AppShell title="New Mock Interview">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mic className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">New Mock Interview</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Voice-based practice interview — AI asks questions, you answer out loud.
          </p>
          {mockQuota && usage && (
            <div className="mt-3">
              <FeatureQuotaBadge quota={mockQuota} isPro={usage.isPro} />
            </div>
          )}
        </div>

        <section className="space-y-4">
          <Label className="text-base font-semibold">Resume source</Label>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                mode === "existing" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
              )}
            >
              <div className="font-medium text-sm mb-1">Use uploaded resume</div>
              <div className="text-xs text-muted-foreground">Select from past analyses</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                mode === "upload" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
              )}
            >
              <div className="font-medium text-sm mb-1">Upload new resume</div>
              <div className="text-xs text-muted-foreground">PDF or paste text</div>
            </button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-2">
              {loadingAnalyses ? (
                <p className="text-sm text-muted-foreground">Loading resumes…</p>
              ) : analyses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No analyses yet.{" "}
                  <Link href="/analyze" className="text-primary underline">
                    Analyze a resume
                  </Link>{" "}
                  first, or upload a new one.
                </p>
              ) : (
                <RadioGroup value={selectedAnalysisId} onValueChange={setSelectedAnalysisId}>
                  {analyses.map((a) => (
                    <label
                      key={a.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        selectedAnalysisId === a.id ? "border-primary bg-primary/5" : "border-border",
                      )}
                    >
                      <RadioGroupItem value={a.id} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          Score {a.result.score}/100 · {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {a.resumeText.slice(0, 120)}…
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Extracting text…" : "Drop PDF or click to upload"}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handlePdfUpload(f);
                  }}
                />
              </label>
              <Textarea
                placeholder="Or paste resume text (min 50 characters)…"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
          )}
        </section>

        <section className="space-y-2">
          <Label htmlFor="role">Target role (optional)</Label>
          <Input
            id="role"
            placeholder="e.g. Backend Engineer, Product Manager"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </section>

        <section className="space-y-3">
          <Label className="text-base font-semibold">Interview type</Label>
          <RadioGroup
            value={interviewType}
            onValueChange={(v) => setInterviewType(v as InterviewType)}
            className="space-y-2"
          >
            {INTERVIEW_TYPES.map((t) => (
              <label
                key={t.value}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 cursor-pointer",
                  interviewType === t.value ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <RadioGroupItem value={t.value} className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
              </label>
            ))}
          </RadioGroup>
        </section>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleStart} disabled={!canStart || starting} className="gap-2">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
            Start Interview
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Link href="/interview/history">
            <Button variant="outline">Past interviews</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
