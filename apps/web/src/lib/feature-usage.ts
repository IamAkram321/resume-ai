/** Shared helpers for freemium feature quotas (mirrors API UsageStatus). */
import type { FeatureQuota, UsageStatus } from "@resume-ai/api-client-react";

export type FeatureKey = "analysis" | "tailor" | "cover_letter" | "interview_prep" | "mock_interview";

export function getFeatureQuota(
  usage: UsageStatus | undefined,
  key: FeatureKey,
): FeatureQuota {
  const found = usage?.features?.find((f) => f.key === key);
  if (found) return found;
  return {
    key,
    label: key,
    used: 0,
    limit: 1,
    remaining: 1,
  };
}

export function isFeatureAvailable(usage: UsageStatus | undefined, key: FeatureKey): boolean {
  if (usage?.isPro) return true;
  return getFeatureQuota(usage, key).remaining > 0;
}

export function formatQuotaLabel(quota: FeatureQuota, isPro: boolean): string {
  if (isPro) return "Unlimited";
  if (quota.limit >= 999_999) return "Unlimited";
  if (quota.remaining <= 0) return `${quota.used} of ${quota.limit} free · limit reached`;
  return `${quota.used} of ${quota.limit} free · ${quota.remaining} left`;
}
