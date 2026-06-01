import { useState } from "react";
import { Link } from "wouter";
import { Trash2, Eye, TrendingUp, FileText, Calendar, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { ScoreRing } from "@/components/score-ring";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListAnalyses, useDeleteAnalysis, useGetAnalysisStats, useGetMyUsage, getListAnalysesQueryKey, getGetAnalysisStatsQueryKey, getGetMyUsageQueryKey } from "@resume-ai/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { RejectionAnalysisPanel } from "@/components/analysis/rejection-analysis";
import { AttentionAnalysisPanel } from "@/components/analysis/attention-analysis";
import type { Analysis } from "@resume-ai/api-client-react";

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
            <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
              {[
                { label: "Total Analyses", value: stats?.total ?? 0, icon: FileText },
                { label: "This Month", value: stats?.thisMonth ?? 0, icon: Calendar },
                { label: "Avg Score", value: stats?.avgScore != null ? `${stats.avgScore}/100` : "—", icon: TrendingUp },
                { label: "Current Plan", value: isPro ? "Pro" : "Free", icon: Crown },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="glass-panel rounded-xl p-5" data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <div className="text-2xl font-bold">{value}</div>
                </div>
              ))}
            </div>

            {/* Usage bar (free users) */}
            {!isPro && usage && (
              <div className="glass-panel rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Daily Usage</span>
                  <span className="text-sm text-muted-foreground" data-testid="usage-counter">{usage.used} / {usage.limit} analyses used today</span>
                </div>
                <Progress value={(usage.used / usage.limit) * 100} className="h-2" />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{usage.remaining} remaining</span>
                  <Link href="/billing">
                    <Button size="sm" variant="ghost" className="text-primary text-xs gap-1">
                      <Crown className="w-3 h-3" />Upgrade for unlimited
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Upgrade banner (free) */}
            {!isPro && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Unlock unlimited analyses</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Go Pro for $9/month — unlimited analyses, detailed feedback, 30-day history.</div>
                </div>
                <Link href="/billing">
                  <Button size="sm" className="gap-1 shrink-0 ml-4" data-testid="upgrade-banner-cta">
                    <Crown className="w-3 h-3" />Upgrade
                  </Button>
                </Link>
              </div>
            )}

            {/* CTA */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Past Analyses</h2>
              <Link href="/analyze">
                <Button size="sm" data-testid="btn-new-analysis">New Analysis</Button>
              </Link>
            </div>

            {/* Table */}
            <div className="glass-panel overflow-hidden rounded-xl">
              {analysesLoading ? (
                <div className="space-y-3 p-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !analyses || analyses.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <div className="font-medium mb-1">No analyses yet</div>
                  <div className="text-muted-foreground text-sm mb-4">Upload your first resume to get started</div>
                  <Link href="/analyze">
                    <Button size="sm">Analyze Resume</Button>
                  </Link>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Job Description</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Score</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(analyses) ? analyses : []).map((a) => (
                      <tr key={a.id} className="border-b border-card-border/50 last:border-0 hover:bg-muted/20 transition-colors" data-testid={`analysis-row-${a.id}`}>
                        <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(a.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-4 text-sm max-w-xs">
                          <div className="truncate">{a.jobDescription.slice(0, 80)}...</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-bold text-sm ${a.score >= 75 ? "text-chart-2" : a.score >= 50 ? "text-chart-3" : "text-destructive"}`} data-testid={`score-${a.id}`}>
                            {a.score}/100
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedAnalysis(a)} data-testid={`btn-view-${a.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteAnalysis.mutate({ id: a.id })} data-testid={`btn-delete-${a.id}`}>
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
      <AnalysisModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />
    </AppShell>
  );
}
