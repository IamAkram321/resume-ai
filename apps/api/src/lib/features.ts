/** Central registry for freemium feature limits — add new features here. */
export const FEATURE_KEYS = [
  "analysis",
  "tailor",
  "cover_letter",
  "interview_prep",
  "mock_interview",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  /** Free-tier uses per UTC day. Pro is unlimited. */
  freeDailyLimit: number;
}

export const FEATURE_DEFINITIONS: Record<FeatureKey, FeatureDefinition> = {
  analysis: {
    key: "analysis",
    label: "Resume analysis",
    freeDailyLimit: 1,
  },
  tailor: {
    key: "tailor",
    label: "Resume tailoring",
    freeDailyLimit: 1,
  },
  cover_letter: {
    key: "cover_letter",
    label: "Cover letter",
    freeDailyLimit: 1,
  },
  interview_prep: {
    key: "interview_prep",
    label: "Interview prep",
    freeDailyLimit: 1,
  },
  mock_interview: {
    key: "mock_interview",
    label: "Mock interview",
    freeDailyLimit: 3,
  },
};

export const PRO_UNLIMITED = 999_999;

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
