import { useCallback, useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import {
  Loader2,
  Sparkles,
  Download,
  Copy,
  Check,
  Crown,
  ArrowLeft,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { AtsImprovementCard } from "@/components/tailoring/ats-improvement-card";
import { RecruiterImpactCard } from "@/components/tailoring/recruiter-impact-card";
import { KeywordPanel } from "@/components/tailoring/keyword-panel";
import { DiffViewer } from "@/components/tailoring/diff-viewer";
import { VersionHistoryPanel } from "@/components/tailoring/version-history-panel";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMyUsage, getGetMyUsageQueryKey } from "@resume-ai/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useScrollToReveal } from "@/hooks/use-scroll-to-reveal";
import { getErrorMessage } from "@/lib/get-error-message";
import {
  createTailoredResume,
  getTailoredResume,
  listTailoredResumes,
  deleteTailoredResume,
  downloadResumeText,
} from "@/lib/api";
import type { TailoredResumeRecord } from "@/lib/tailoring-types";
import { getFeatureQuota, isFeatureAvailable } from "@/lib/feature-usage";
import { FeatureQuotaBadge, UpgradePrompt } from "@/components/usage/feature-quota";

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

export default function Tailor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/tailor/:id");
  const recordId = params?.id;

  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const analysisIdFromQuery = searchParams.get("analysisId");

  const { isLoaded, isSignedIn } = useAuth();
  const { data: usage } = useGetMyUsage();
  const isPro = usage?.isPro ?? false;
  const tailorQuota = getFeatureQuota(usage, "tailor");
  const canUseTailor = isFeatureAvailable(usage, "tailor");

  const [record, setRecord] = useState<TailoredResumeRecord | null>(null);
  const [versions, setVersions] = useState<TailoredResumeRecord[]>([]);
  const [loading, setLoading] = useState(!!recordId);
  const [generating, setGenerating] = useState(false);

  const resultsReveal = useScrollToReveal();

  const refreshVersions = useCallback(async () => {
    try {
      const list = await listTailoredResumes();
      setVersions(list);
    } catch {
      /* non-fatal */
    }
  }, []);

  const loadRecord = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await getTailoredResume(id);
      setRecord(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not load tailored resume";
      toast({ title: "Load failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void refreshVersions();
  }, [refreshVersions, isLoaded, isSignedIn]);

  useEffect(() => {
    if (recordId) {
      void loadRecord(recordId);
    } else {
      setRecord(null);
      setLoading(false);
    }
  }, [recordId, loadRecord]);

  const runTailoring = async () => {
    if (!isLoaded || !isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in again to tailor your resume.",
        variant: "destructive",
      });
      return;
    }

    if (!analysisIdFromQuery) {
      toast({
        title: "No analysis linked",
        description: "Run an analysis first, then open tailoring from the results page.",
        variant: "destructive",
      });
      return;
    }

    if (!canUseTailor) {
      toast({
        title: "Free limit reached",
        description: "You've used your free tailoring for today. Upgrade to Pro for unlimited tailoring.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const created = await createTailoredResume({ analysisId: analysisIdFromQuery });
      setRecord(created);
      setVersions((prev) => [created, ...prev.filter((v) => v.id !== created.id)]);
      queryClient.invalidateQueries({ queryKey: getGetMyUsageQueryKey() });
      resultsReveal.queueReveal();
      setLocation(`/tailor/${created.id}`, { replace: true });
      toast({ title: "Tailoring complete", description: "Your optimized resume is ready to review." });
    } catch (err: unknown) {
      toast({
        title: "Tailoring failed",
        description: getErrorMessage(err, "Tailoring failed"),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTailoredResume(id);
      await refreshVersions();
      setVersions((prev) => prev.filter((v) => v.id !== id));
      if (record?.id === id) {
        setRecord(null);
        setLocation(analysisIdFromQuery ? `/tailor?analysisId=${analysisIdFromQuery}` : "/tailor", { replace: true });
      }
      toast({ title: "Version deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const tailoring = record?.result;

  return (
    <AppShell
      title="One-click tailoring"
      description="Tailor your resume for a specific role — honest rewrites only, with a full change log."
      isPro={isPro}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={analysisIdFromQuery ? `/analyze` : "/dashboard"}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        {usage && !isPro && (
          <FeatureQuotaBadge quota={tailorQuota} isPro={isPro} />
        )}
      </div>

      {!record && !loading && (
        <div className="glass-panel mb-8 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Generate tailored resume
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Uses your resume, job description, and prior ATS / rejection / attention analysis.
                Nothing is invented — only strengthened and repositioned.
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 glow-ring shrink-0"
              disabled={generating || !analysisIdFromQuery || !canUseTailor}
              onClick={() => void runTailoring()}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tailoring resume…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  One-click tailor
                </>
              )}
            </Button>
          </div>
          {!analysisIdFromQuery && (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link href="/analyze" className="text-primary font-medium hover:underline">
                Run an analysis
              </Link>{" "}
              first, then click &quot;Tailor for this role&quot; on your results.
            </p>
          )}
          {!isPro && !canUseTailor && (
            <div className="mt-4">
              <UpgradePrompt
                compact
                description={`You've used ${tailorQuota.used} of ${tailorQuota.limit} free tailoring today. Pro unlocks unlimited tailoring, export, and version management.`}
              />
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {tailoring && record && (
        <div ref={resultsReveal.ref} className="scroll-reveal-target space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-wrap gap-2 justify-end">
            <CopyButton text={record.tailoredResume} />
            {isPro ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  downloadResumeText(
                    `${(record.label ?? "tailored-resume").replace(/\s+/g, "-")}.txt`,
                    record.tailoredResume,
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />
                Export .txt
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <Link href="/billing">
                  <Crown className="h-3.5 w-3.5" />
                  Pro export
                </Link>
              </Button>
            )}
          </div>

          <AtsImprovementCard metrics={tailoring.metrics} improvements={tailoring.topImprovements} />
          <RecruiterImpactCard impact={tailoring.recruiterImpact} />
          <KeywordPanel keywords={tailoring.keywordOptimization} />
          <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <DiffViewer
              original={record.originalResume}
              tailored={record.tailoredResume}
              changes={tailoring.changes}
            />
          </div>
        </div>
      )}

      <div className="mt-8">
        <VersionHistoryPanel
          versions={versions}
          activeId={record?.id}
          isPro={isPro}
          onDelete={isPro ? (id) => void handleDelete(id) : undefined}
        />
      </div>
    </AppShell>
  );
}
