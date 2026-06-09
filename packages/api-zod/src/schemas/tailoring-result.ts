import { z } from "zod";

export const AlignmentLevelSchema = z.enum(["Low", "Medium", "High"]);

export const TailoringChangeTypeSchema = z.enum([
  "keyword",
  "bullet_improvement",
  "section_reorder",
  "visibility",
  "wording",
]);

export const TailoringChangeSchema = z.object({
  type: TailoringChangeTypeSchema,
  section: z.string().min(1),
  original: z.string().min(1),
  optimized: z.string().min(1),
  reason: z.string().min(1),
});

export const TailoringMetricsSchema = z.object({
  atsBefore: z.number().min(0).max(100),
  atsAfter: z.number().min(0).max(100),
  recruiterAlignmentBefore: AlignmentLevelSchema,
  recruiterAlignmentAfter: AlignmentLevelSchema,
  roleMatchBefore: AlignmentLevelSchema,
  roleMatchAfter: AlignmentLevelSchema,
});

export const KeywordOptimizationSchema = z.object({
  present: z.array(z.string().min(1)),
  added: z.array(z.string().min(1)),
  stillMissing: z.array(z.string().min(1)),
});

export const RecruiterImpactSchema = z.object({
  beforeSummary: z.string().min(1),
  afterSummary: z.string().min(1),
  recruiterVisibilityImproved: z.boolean(),
  technicalAlignmentImproved: z.boolean(),
  atsCompatibilityImproved: z.boolean(),
  applicationCompetitivenessImproved: z.boolean(),
});

/** Full tailoring payload from LLM (also stored in `tailored_resumes.result`). */
export const TailoringResultSchema = z.object({
  tailoredResume: z.string().min(100),
  targetRole: z.string().min(1).optional(),
  metrics: TailoringMetricsSchema,
  topImprovements: z.array(z.string().min(1)).min(2).max(8),
  changes: z.array(TailoringChangeSchema).min(3).max(25),
  keywordOptimization: KeywordOptimizationSchema,
  recruiterImpact: RecruiterImpactSchema,
});

export type AlignmentLevel = z.infer<typeof AlignmentLevelSchema>;
export type TailoringChangeType = z.infer<typeof TailoringChangeTypeSchema>;
export type TailoringChange = z.infer<typeof TailoringChangeSchema>;
export type TailoringMetrics = z.infer<typeof TailoringMetricsSchema>;
export type KeywordOptimization = z.infer<typeof KeywordOptimizationSchema>;
export type RecruiterImpact = z.infer<typeof RecruiterImpactSchema>;
export type TailoringResult = z.infer<typeof TailoringResultSchema>;

/** LLM metadata pass — resume text is generated separately as plain text. */
export const TailoringMetadataSchema = TailoringResultSchema.omit({ tailoredResume: true });

export type TailoringMetadata = z.infer<typeof TailoringMetadataSchema>;

export function parseTailoringResultFromLlm(raw: unknown): TailoringResult {
  return TailoringResultSchema.parse(raw);
}

export function parseTailoringMetadataFromLlm(raw: unknown): TailoringMetadata {
  return TailoringMetadataSchema.parse(raw);
}
