import { and, eq, sql } from "drizzle-orm";
import { db, featureUsageTable } from "@resume-ai/db";
import {
  FEATURE_DEFINITIONS,
  FEATURE_KEYS,
  PRO_UNLIMITED,
  todayUtc,
  type FeatureKey,
} from "./features";

export interface FeatureQuota {
  key: FeatureKey;
  label: string;
  used: number;
  limit: number;
  remaining: number;
}

export interface UsageSummary {
  isPro: boolean;
  features: FeatureQuota[];
  /** @deprecated Legacy field — mirrors analysis quota for older clients. */
  used: number;
  limit: number;
  remaining: number;
}

function quotaFromCounts(
  key: FeatureKey,
  used: number,
  isPro: boolean,
): FeatureQuota {
  const def = FEATURE_DEFINITIONS[key];
  const limit = isPro ? PRO_UNLIMITED : def.freeDailyLimit;
  const remaining = isPro ? PRO_UNLIMITED : Math.max(0, limit - used);
  return { key, label: def.label, used: isPro ? 0 : used, limit, remaining };
}

export async function getFeatureUsedToday(
  userId: string,
  feature: FeatureKey,
): Promise<number> {
  const usageDate = todayUtc();
  const [row] = await db
    .select()
    .from(featureUsageTable)
    .where(
      and(
        eq(featureUsageTable.userId, userId),
        eq(featureUsageTable.feature, feature),
        eq(featureUsageTable.usageDate, usageDate),
      ),
    );
  return row?.count ?? 0;
}

export async function getUsageSummary(userId: string, isPro: boolean): Promise<UsageSummary> {
  const usageDate = todayUtc();
  const rows = await db
    .select()
    .from(featureUsageTable)
    .where(
      and(eq(featureUsageTable.userId, userId), eq(featureUsageTable.usageDate, usageDate)),
    );

  const usedByFeature = new Map(rows.map((r) => [r.feature as FeatureKey, r.count]));

  const features = FEATURE_KEYS.map((key) =>
    quotaFromCounts(key, usedByFeature.get(key) ?? 0, isPro),
  );

  const analysis = features.find((f) => f.key === "analysis")!;
  return {
    isPro,
    features,
    used: analysis.used,
    limit: analysis.limit,
    remaining: analysis.remaining,
  };
}

export async function checkFeatureQuota(
  userId: string,
  feature: FeatureKey,
  isPro: boolean,
): Promise<FeatureQuota & { allowed: boolean }> {
  if (isPro) {
    return { ...quotaFromCounts(feature, 0, true), allowed: true };
  }

  const used = await getFeatureUsedToday(userId, feature);
  const quota = quotaFromCounts(feature, used, false);
  return { ...quota, allowed: used < quota.limit };
}

export async function consumeFeatureQuota(
  userId: string,
  feature: FeatureKey,
  isPro: boolean,
): Promise<void> {
  if (isPro) return;

  const usageDate = todayUtc();
  await db
    .insert(featureUsageTable)
    .values({ userId, feature, usageDate, count: 1 })
    .onConflictDoUpdate({
      target: [
        featureUsageTable.userId,
        featureUsageTable.feature,
        featureUsageTable.usageDate,
      ],
      set: { count: sql`${featureUsageTable.count} + 1` },
    });
}

export function featureLimitError(feature: FeatureKey, quota: FeatureQuota): {
  status: number;
  body: { error: string; code: string; feature: FeatureKey; quota: FeatureQuota };
} {
  return {
    status: 429,
    body: {
      error: `Free limit reached for ${quota.label} (${quota.used} of ${quota.limit} used today). Upgrade to Pro for unlimited access.`,
      code: "feature_limit_exceeded",
      feature,
      quota,
    },
  };
}
