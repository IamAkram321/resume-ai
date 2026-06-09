import type { ComponentType } from "react";
import { TrendingUp, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TailoringMetrics, AlignmentLevel } from "@/lib/tailoring-types";

function MetricBar({
  label,
  before,
  after,
  icon: Icon,
}: {
  label: string;
  before: number | AlignmentLevel;
  after: number | AlignmentLevel;
  icon: ComponentType<{ className?: string }>;
}) {
  const isNumeric = typeof before === "number";
  const improved = isNumeric
    ? (after as number) > (before as number)
    : levelRank(after as AlignmentLevel) > levelRank(before as AlignmentLevel);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Before</p>
          <p className="text-lg font-bold tabular-nums text-muted-foreground">{before}</p>
        </div>
        <TrendingUp
          className={cn("h-4 w-4 shrink-0", improved ? "text-chart-2" : "text-muted-foreground/40")}
        />
        <div className="text-right">
          <p className="text-[10px] uppercase text-muted-foreground">After</p>
          <p className={cn("text-lg font-bold tabular-nums", improved && "text-chart-2")}>{after}</p>
        </div>
      </div>
    </div>
  );
}

function levelRank(level: AlignmentLevel): number {
  return level === "High" ? 3 : level === "Medium" ? 2 : 1;
}

export function AtsImprovementCard({
  metrics,
  improvements,
}: {
  metrics: TailoringMetrics;
  improvements: string[];
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Resume tailoring complete</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Estimated improvements for this role — based on your content, not invented experience.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricBar label="ATS score" before={metrics.atsBefore} after={metrics.atsAfter} icon={Target} />
        <MetricBar
          label="Recruiter alignment"
          before={metrics.recruiterAlignmentBefore}
          after={metrics.recruiterAlignmentAfter}
          icon={Users}
        />
        <MetricBar
          label="Role match"
          before={metrics.roleMatchBefore}
          after={metrics.roleMatchAfter}
          icon={TrendingUp}
        />
      </div>

      {improvements.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Top improvements
          </p>
          <ul className="space-y-2">
            {improvements.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="text-chart-2 font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
