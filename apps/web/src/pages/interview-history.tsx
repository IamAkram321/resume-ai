import { Link } from "wouter";
import { format } from "date-fns";
import { Mic, Loader2, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listInterviews, type InterviewRecord } from "@/lib/interview-api";
import { cn } from "@/lib/utils";

function statusBadge(status: InterviewRecord["status"]) {
  switch (status) {
    case "completed":
      return <Badge className="bg-chart-2/15 text-chart-2 border-chart-2/30">Completed</Badge>;
    case "in_progress":
      return <Badge className="bg-primary/15 text-primary border-primary/30">In progress</Badge>;
    case "abandoned":
      return <Badge variant="secondary">Abandoned</Badge>;
  }
}

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listInterviews()
      .then(setInterviews)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Interview History">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Interview History</h1>
          </div>
          <Link href="/interview/new">
            <Button size="sm">New interview</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-16 space-y-4 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground text-sm">No mock interviews yet.</p>
            <Link href="/interview/new">
              <Button>Start your first interview</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {interviews.map((iv) => (
              <li key={iv.id}>
                <Link href={`/interview/${iv.id}`}>
                  <div
                    className={cn(
                      "flex items-center gap-4 rounded-xl border border-border p-4",
                      "hover:border-primary/40 hover:bg-muted/20 transition-colors cursor-pointer",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {statusBadge(iv.status)}
                        <Badge variant="outline" className="capitalize text-xs">
                          {iv.interviewType}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {iv.targetRole ?? "General interview"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(iv.startedAt), "MMM d, yyyy · h:mm a")} ·{" "}
                        {iv.turnCount} answers
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
