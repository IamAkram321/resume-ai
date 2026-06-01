import { useState } from "react";
import {
  ChevronDown,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RejectionAnalysis, RejectionReason } from "@resume-ai/api-zod";

const SEVERITY_STYLES = {
  High: "bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/25",
  Medium: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/25",
  Low: "bg-muted text-muted-foreground border-border",
} as const;

const RISK_STYLES = {
  Low: {
    label: "Low rejection risk",
    badge: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
    bar: "w-1/3 bg-emerald-500",
  },
  Medium: {
    label: "Medium rejection risk",
    badge: "bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/30",
    icon: ShieldAlert,
    bar: "w-2/3 bg-amber-500",
  },
  High: {
    label: "High rejection risk",
    badge: "bg-orange-500/12 text-orange-800 dark:text-orange-300 border-orange-500/30",
    icon: AlertTriangle,
    bar: "w-full bg-orange-500",
  },
} as const;

const IMPACT_STYLES = {
  High: "text-chart-2 font-semibold",
  Medium: "text-primary font-medium",
  Low: "text-muted-foreground",
} as const;

function ReasonCard({ reason, index }: { reason: RejectionReason; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-background/50 transition-colors",
        open && "border-primary/20 shadow-sm",
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 p-4 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{reason.title}</span>
            <Badge variant="outline" className={cn("text-[10px]", SEVERITY_STYLES[reason.severity])}>
              {reason.severity}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {reason.category}
            </Badge>
          </div>
          {!open && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{reason.explanation}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border/50 px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Evidence
            </p>
            <p className="text-xs leading-relaxed text-foreground/90">{reason.evidence}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Why it matters
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{reason.explanation}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Recruiter impact
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{reason.impact}</p>
          </div>
          <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
              Recommended fix
            </p>
            <p className="text-sm leading-relaxed">{reason.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function RejectionAnalysisPanel({ data }: { data: RejectionAnalysis }) {
  const risk = RISK_STYLES[data.overallRisk];
  const RiskIcon = risk.icon;

  return (
    <section className="glass-panel overflow-hidden rounded-2xl">
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/5 via-transparent to-transparent px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Why you may get rejected</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Hiring intelligence based on your resume, this role, and ATS signals — not guesswork.
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("gap-1.5 px-3 py-1.5 text-xs shrink-0", risk.badge)}>
            <RiskIcon className="h-3.5 w-3.5" />
            {risk.label}
          </Badge>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", risk.bar)}
          />
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Top rejection reasons
          </h3>
          <div className="space-y-2">
            {data.reasons.map((reason, i) => (
              <ReasonCard key={`${reason.title}-${i}`} reason={reason} index={i} />
            ))}
          </div>
        </div>

        {data.opportunities.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prioritized improvements
              </h3>
            </div>
            <ul className="space-y-2">
              {data.opportunities.map((opp, i) => (
                <li
                  key={`${opp.action}-${i}`}
                  className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-medium">{opp.action}</span>
                  <span className={cn("text-xs shrink-0", IMPACT_STYLES[opp.estimatedImpact])}>
                    {opp.estimatedImpact} impact
                  </span>
                </li>
              ))}
            </ul>
            {data.opportunities.some((o) => o.rationale) && (
              <p className="mt-3 text-xs text-muted-foreground">
                Impact ratings reflect how strongly each change could improve screening outcomes for
                this specific role — not arbitrary percentages.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
