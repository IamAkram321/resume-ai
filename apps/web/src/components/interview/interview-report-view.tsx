import { Link } from "wouter";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InterviewDetails, InterviewReport } from "@/lib/interview-api";
import { cn } from "@/lib/utils";

function CollapsibleSection({
  title,
  items,
  defaultOpen = true,
  variant = "default",
}: {
  title: string;
  items: string[];
  defaultOpen?: boolean;
  variant?: "default" | "success" | "warning";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const border =
    variant === "success"
      ? "border-chart-2/30"
      : variant === "warning"
        ? "border-chart-3/30"
        : "border-border";

  return (
    <div className={cn("rounded-xl border overflow-hidden", border)}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <ul className="px-4 pb-4 space-y-2 border-t border-border/60">
          {items.map((item) => (
            <li key={item} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-primary shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function InterviewReportView({
  report,
  interview,
}: {
  report: InterviewReport;
  interview: InterviewDetails;
}) {
  const scoreColor =
    report.overallScore >= 8
      ? "text-chart-2"
      : report.overallScore >= 5
        ? "text-chart-3"
        : "text-destructive";

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/interview/history">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> History
          </Button>
        </Link>
      </div>

      <div className="text-center space-y-3">
        <Badge variant="secondary" className="capitalize">
          {interview.interviewType} · {interview.targetRole ?? "General"}
        </Badge>
        <div className={cn("text-6xl font-extrabold tabular-nums", scoreColor)}>
          {report.overallScore}
          <span className="text-2xl text-muted-foreground font-normal">/10</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{report.scoreJustification}</p>
        <p className="text-sm leading-relaxed">{report.summaryText}</p>
      </div>

      <div className="space-y-3">
        <CollapsibleSection title="Strengths" items={report.strengths} variant="success" />
        <CollapsibleSection title="Areas to improve" items={report.weaknesses} variant="warning" />
        <CollapsibleSection title="Next steps" items={report.improvementAreas} />
        <CollapsibleSection title="Communication notes" items={report.communicationNotes} defaultOpen={false} />
      </div>

      {interview.turns.length > 0 && (
        <CollapsibleSection
          title="Full transcript"
          items={interview.turns
            .filter((t) => t.userAnswerText)
            .map(
              (t) =>
                `Q: ${t.questionText}\nA: ${t.userAnswerText}`,
            )}
          defaultOpen={false}
        />
      )}

      <div className="flex justify-center gap-3">
        <Link href="/interview/new">
          <Button>Practice again</Button>
        </Link>
      </div>
    </div>
  );
}
