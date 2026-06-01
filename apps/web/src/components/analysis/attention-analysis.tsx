import { useState } from "react";
import {
  Eye,
  Clock,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Lightbulb,
  LayoutList,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AttentionAnalysis,
  AttentionArea,
  AttentionLevel,
  VisibilityScores,
} from "@resume-ai/api-client-react";

const LEVEL_STYLES: Record<
  AttentionLevel,
  { badge: string; bar: string; width: string }
> = {
  High: {
    badge: "bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/25",
    bar: "bg-violet-500",
    width: "w-full",
  },
  Medium: {
    badge: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/25",
    bar: "bg-sky-500",
    width: "w-2/3",
  },
  Low: {
    badge: "bg-muted text-muted-foreground border-border",
    bar: "bg-muted-foreground/40",
    width: "w-1/3",
  },
};

const VISIBILITY_LABELS: { key: keyof VisibilityScores; label: string }[] = [
  { key: "experienceVisibility", label: "Experience" },
  { key: "projectVisibility", label: "Projects" },
  { key: "skillsVisibility", label: "Skills" },
  { key: "achievementVisibility", label: "Achievements" },
  { key: "leadershipVisibility", label: "Leadership" },
  { key: "educationVisibility", label: "Education" },
];

function AttentionBadge({ level }: { level: AttentionLevel }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] shrink-0", LEVEL_STYLES[level].badge)}>
      {level} attention
    </Badge>
  );
}

function AreaList({
  title,
  areas,
  variant,
}: {
  title: string;
  areas: AttentionArea[];
  variant: "focus" | "ignore";
}) {
  if (areas.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {variant === "focus" ? (
          <Eye className="h-3.5 w-3.5 text-primary" />
        ) : (
          <LayoutList className="h-3.5 w-3.5" />
        )}
        {title}
      </h3>
      <ul className="space-y-2">
        {areas.map((area, i) => (
          <li
            key={`${area.section}-${i}`}
            className={cn(
              "rounded-xl border px-4 py-3",
              variant === "focus"
                ? "border-primary/15 bg-primary/5"
                : "border-border/60 bg-muted/15",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{area.section}</span>
              <AttentionBadge level={area.attentionScore} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{area.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VisibilityGrid({ scores }: { scores: VisibilityScores }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Section visibility (heuristic)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {VISIBILITY_LABELS.map(({ key, label }) => {
          const level = scores[key];
          return (
            <div key={key} className="rounded-xl border border-border/50 bg-background/50 px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{label}</span>
                <AttentionBadge level={level} />
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    LEVEL_STYLES[level].bar,
                    LEVEL_STYLES[level].width,
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineView({
  phases,
}: {
  phases: AttentionAnalysis["timeline"];
}) {
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-primary" />
        10-second recruiter walkthrough
      </h3>
      <ol className="relative space-y-0 border-l border-primary/20 pl-6 ml-2">
        {phases.map((phase, i) => (
          <li key={i} className="relative pb-6 last:pb-0">
            <span className="absolute -left-[1.6rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
              {i + 1}
            </span>
            <p className="text-xs font-semibold text-primary">{phase.timeRange}</p>
            <p className="mt-1 text-sm leading-relaxed">{phase.recruiterNotices}</p>
            {phase.sectionsEvaluated && phase.sectionsEvaluated.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {phase.sectionsEvaluated.map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px] font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function InsightBlock({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: typeof Sparkles;
  tone: "positive" | "concern" | "hidden" | "missed";
}) {
  if (items.length === 0) return null;

  const styles = {
    positive: "border-emerald-500/20 bg-emerald-500/5",
    concern: "border-amber-500/20 bg-amber-500/5",
    hidden: "border-primary/20 bg-primary/5",
    missed: "border-sky-500/20 bg-sky-500/5",
  };

  return (
    <div className={cn("rounded-xl border p-4", styles[tone])}>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" />
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationCard({
  action,
  expectedEffect,
  index,
}: {
  action: string;
  expectedEffect: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-background/50">
      <button
        type="button"
        className="flex w-full items-center gap-3 p-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium">{action}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 animate-in fade-in duration-200">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Expected effect
          </p>
          <p className="text-sm text-muted-foreground">{expectedEffect}</p>
        </div>
      )}
    </div>
  );
}

export function AttentionAnalysisPanel({ data }: { data: AttentionAnalysis }) {
  return (
    <section className="glass-panel overflow-hidden rounded-2xl">
      <div className="border-b border-border/60 bg-gradient-to-r from-violet-500/8 via-transparent to-transparent px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
            <Eye className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Recruiter attention analysis</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Estimates what a recruiter would likely notice in the first 10–15 seconds — based on
              resume structure and hiring heuristics, not eye tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-5 sm:p-6">
        <VisibilityGrid scores={data.visibilityScores} />

        <div className="grid gap-8 lg:grid-cols-2">
          <AreaList title="Most likely first focus" areas={data.firstFocusAreas} variant="focus" />
          <AreaList title="Likely skipped or deprioritized" areas={data.ignoredAreas} variant="ignore" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InsightBlock
            title="Positive signals"
            items={data.positiveSignals}
            icon={Sparkles}
            tone="positive"
          />
          <InsightBlock
            title="Potential concerns"
            items={data.concerns}
            icon={AlertCircle}
            tone="concern"
          />
        </div>

        <TimelineView phases={data.timeline} />

        {(data.hiddenStrengths.length > 0 || data.missedOpportunities.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <InsightBlock
              title="Hidden strengths"
              items={data.hiddenStrengths.map((h) => h.insight)}
              icon={Lightbulb}
              tone="hidden"
            />
            <InsightBlock
              title="Missed opportunities"
              items={data.missedOpportunities.map((m) => m.insight)}
              icon={TrendingUp}
              tone="missed"
            />
          </div>
        )}

        {data.recommendations.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Layout & content recommendations
            </h3>
            <div className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <RecommendationCard
                  key={i}
                  index={i}
                  action={rec.action}
                  expectedEffect={rec.expectedEffect}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
