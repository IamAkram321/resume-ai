import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { RecruiterImpact } from "@/lib/tailoring-types";

const FLAGS = [
  { key: "recruiterVisibilityImproved" as const, label: "Recruiter visibility improved" },
  { key: "technicalAlignmentImproved" as const, label: "Technical alignment improved" },
  { key: "atsCompatibilityImproved" as const, label: "ATS compatibility improved" },
  { key: "applicationCompetitivenessImproved" as const, label: "Application competitiveness improved" },
];

export function RecruiterImpactCard({ impact }: { impact: RecruiterImpact }) {
  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      <h3 className="font-semibold">Recruiter impact analysis</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Before tailoring
          </p>
          <p className="mt-2 text-sm leading-relaxed">{impact.beforeSummary}</p>
        </div>
        <ArrowRight className="mx-auto hidden h-5 w-5 text-muted-foreground md:block" />
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            After tailoring
          </p>
          <p className="mt-2 text-sm leading-relaxed">{impact.afterSummary}</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {FLAGS.map(({ key, label }) =>
          impact[key] ? (
            <li
              key={key}
              className="flex items-center gap-1.5 rounded-full border border-chart-2/30 bg-chart-2/10 px-3 py-1 text-xs font-medium text-chart-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {label}
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}
