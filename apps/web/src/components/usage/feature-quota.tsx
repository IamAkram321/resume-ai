import { Link } from "wouter";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeatureQuota } from "@resume-ai/api-client-react";
import { formatQuotaLabel } from "@/lib/feature-usage";

export function FeatureQuotaBadge({
  quota,
  isPro,
  className,
}: {
  quota: FeatureQuota;
  isPro: boolean;
  className?: string;
}) {
  const exhausted = !isPro && quota.remaining <= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        exhausted
          ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      {formatQuotaLabel(quota, isPro)}
    </span>
  );
}

export function UpgradePrompt({
  title = "Free limit reached",
  description,
  compact = false,
}: {
  title?: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className={cn("flex gap-4", compact ? "flex-col sm:flex-row sm:items-center" : "flex-col sm:flex-row sm:items-start sm:justify-between")}>
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <Crown className="h-4 w-4 text-primary" />
            {title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Link href="/billing">
          <Button size={compact ? "sm" : "default"} className="gap-1.5 shrink-0 w-full sm:w-auto">
            <Crown className="h-3.5 w-3.5" />
            Upgrade to Pro
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function FreeUsageOverview({
  features,
  isPro,
}: {
  features: FeatureQuota[];
  isPro: boolean;
}) {
  if (isPro) return null;

  return (
    <div className="glass-panel rounded-xl px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Today&apos;s free usage
      </p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {features.map((f) => (
          <li key={f.key} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{f.label}</span>
            <FeatureQuotaBadge quota={f} isPro={isPro} />
          </li>
        ))}
      </ul>
    </div>
  );
}
