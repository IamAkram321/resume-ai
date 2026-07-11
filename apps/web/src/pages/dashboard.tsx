import { useState } from "react";
import { Link } from "wouter";
import { Trash2, Eye, TrendingUp, FileText, Calendar, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListAnalyses, useDeleteAnalysis, useGetAnalysisStats, useGetMyUsage, getListAnalysesQueryKey, getGetAnalysisStatsQueryKey, getGetMyUsageQueryKey } from "@resume-ai/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { RejectionAnalysisPanel } from "@/components/analysis/rejection-analysis";
import { AttentionAnalysisPanel } from "@/components/analysis/attention-analysis";
import type { Analysis } from "@resume-ai/api-client-react";
import { FreeUsageOverview, UpgradePrompt } from "@/components/usage/feature-quota";

function AnalysisModal({ analysis, onClose }: { analysis: Analysis | null; onClose: () => void }) {
  if (!analysis) return null;
  const result = analysis.result;

  return (
    <Dialog open={!!analysis} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-card-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ScoreRing score={result.score} size="sm" />
            <div>
              <div className="text-lg font-semibold">Analysis Result</div>
              <div className="text-sm text-muted-foreground font-normal">
                {format(new Date(analysis.createdAt), "MMM d, yyyy")}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        {result.attentionAnalysis && (
          <div className="mb-4">
            <AttentionAnalysisPanel data={result.attentionAnalysis} />
          </div>
        )}
        {result.rejectionAnalysis && (
          <div className="mb-4">
            <RejectionAnalysisPanel data={result.rejectionAnalysis} />
          </div>
        )}
        <Tabs defaultValue="overview">
          <TabsList className="w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="strengths">Strengths</TabsTrigger>
            <TabsTrigger value="weaknesses">Gaps</TabsTrigger>
            <TabsTrigger value="suggestions">Rewrites</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
            {result.atsKeywords.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Missing ATS Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {result.atsKeywords.map(k => <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>)}
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="strengths" className="mt-4">
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-chart-2 font-bold mt-0.5">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="weaknesses" className="mt-4">
            <ul className="space-y-2">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-destructive font-bold mt-0.5">-</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="suggestions" className="mt-4 space-y-4">
            {result.suggestions.map((s, i) => (
              <div key={i} className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="font-medium text-sm">{s.issue}</div>
                <div className="text-xs text-muted-foreground line-through">{s.before}</div>
                <div className="text-xs text-chart-2">{s.after}</div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

  const { data: analyses, isLoading: analysesLoading } = useListAnalyses();
  const { data: stats } = useGetAnalysisStats();
  const { data: usage } = useGetMyUsage();
  const deleteAnalysis = useDeleteAnalysis({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
        toast({ title: "Analysis deleted" });
      },
      onError: () => {
        toast({ title: "Failed to delete", variant: "destructive" });
      },
    },
  });

  const isPro = usage?.isPro ?? false;

  return (
    <AppShell title="Dashboard" description="Track analyses and improve your match scores over time." isPro={isPro}>
      {/* Primary Actions Hero Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Left Card: Primary Focus (2/3 width) */}
        <div className="md:col-span-2 border border-border bg-card rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/5 text-primary border border-primary/10 mb-2">
              Resume Intelligence
            </div>
            <h3 className="text-xl font-semibold text-foreground">Analyze & Tailor Your Resume</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              Upload your resume and paste a job description. Get an instant match score out of 100, recruiter attention insights, lists of missing ATS keywords, and optimized bullet-point rewrites.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/analyze">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-sm" data-testid="btn-new-analysis">
                New Analysis
              </Button>
            </Link>
            <Link href="/tailor">
              <Button size="sm" variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground">
                Tailor Resume
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Card: Secondary Focus (1/3 width) */}
        <div className="border border-border bg-card rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted text-muted-foreground border border-border mb-2">
              Mock Interview
            </div>
            <h3 className="text-xl font-semibold text-foreground">Practice Interviews</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Simulate real behavioral or technical interviews. Speak out loud and get grading feedback from AI.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/interview/new">
              <Button size="sm" variant="outline" className="w-full border-border hover:bg-accent hover:text-accent-foreground">
                Start Mock Interview
              </Button>
            </Link>
            <Link href="/interview/history">
              <Button size="sm" variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground">
                View Past Interviews
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
        {[
          { label: "Total Analyses", value: stats?.total ?? 0, icon: FileText },
          { label: "This Month", value: stats?.thisMonth ?? 0, icon: Calendar },
          { label: "Avg Score", value: stats?.avgScore != null ? `${stats.avgScore}/100` : "—", icon: TrendingUp },
          { label: "Current Plan", value: isPro ? "Pro" : "Free", icon: Crown },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-border bg-card rounded-xl p-5 shadow-sm" data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
          </div>
        ))}
      </div>

      {!isPro && usage?.features && (
        <div className="mb-6">
          <FreeUsageOverview features={usage.features} isPro={isPro} />
        </div>
      )}

      {!isPro && (
        <div className="mb-6">
          <UpgradePrompt
            compact
            title="Need more today?"
            description="Free includes 1 use per feature per day. Pro unlocks unlimited analyses, tailoring, cover letters, and interview prep."
          />
        </div>
      )}

      {/* Past Analyses Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Past Analyses</h2>
        </div>

        <div className="border border-border bg-card overflow-hidden rounded-xl shadow-sm">
          {analysesLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !analyses || analyses.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <div className="font-semibold text-sm mb-1">No analyses yet</div>
              <div className="text-muted-foreground text-sm mb-4">Upload your first resume to get started</div>
              <Link href="/analyze">
                <Button size="sm">Analyze Resume</Button>
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Job Description</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Score</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(analyses) ? analyses : []).map((a) => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors" data-testid={`analysis-row-${a.id}`}>
                    <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(a.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-4 text-sm max-w-xs">
                      <div className="truncate text-foreground font-medium">{a.jobDescription.slice(0, 80)}...</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-semibold text-sm ${a.score >= 75 ? "text-chart-2" : a.score >= 50 ? "text-chart-3" : "text-destructive"}`} data-testid={`score-${a.id}`}>
                        {a.score}/100
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedAnalysis(a)} data-testid={`btn-view-${a.id}`}>
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteAnalysis.mutate({ id: a.id })} data-testid={`btn-delete-${a.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <AnalysisModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />
    </AppShell>
  );
}
