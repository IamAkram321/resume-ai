/** Client types aligned with @resume-ai/api-zod/schemas/tailoring-result */

export type AlignmentLevel = "Low" | "Medium" | "High";

export type TailoringChangeType =
  | "keyword"
  | "bullet_improvement"
  | "section_reorder"
  | "visibility"
  | "wording";

export interface TailoringChange {
  type: TailoringChangeType;
  section: string;
  original: string;
  optimized: string;
  reason: string;
}

export interface TailoringMetrics {
  atsBefore: number;
  atsAfter: number;
  recruiterAlignmentBefore: AlignmentLevel;
  recruiterAlignmentAfter: AlignmentLevel;
  roleMatchBefore: AlignmentLevel;
  roleMatchAfter: AlignmentLevel;
}

export interface KeywordOptimization {
  present: string[];
  added: string[];
  stillMissing: string[];
}

export interface RecruiterImpact {
  beforeSummary: string;
  afterSummary: string;
  recruiterVisibilityImproved: boolean;
  technicalAlignmentImproved: boolean;
  atsCompatibilityImproved: boolean;
  applicationCompetitivenessImproved: boolean;
}

export interface TailoringResult {
  tailoredResume: string;
  targetRole?: string;
  metrics: TailoringMetrics;
  topImprovements: string[];
  changes: TailoringChange[];
  keywordOptimization: KeywordOptimization;
  recruiterImpact: RecruiterImpact;
}

export interface TailoredResumeRecord {
  id: string;
  userId: string;
  analysisId: string | null;
  originalResume: string;
  tailoredResume: string;
  jobDescription: string;
  targetRole: string | null;
  atsBefore: number;
  atsAfter: number;
  result: TailoringResult;
  label: string | null;
  createdAt: string;
}

export interface TailorUsage {
  used: number;
  limit: number;
  remaining: number;
  isPro: boolean;
}
