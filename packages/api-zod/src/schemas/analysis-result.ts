import { z } from "zod";

export const SeveritySchema = z.enum(["High", "Medium", "Low"]);
export const RiskLevelSchema = z.enum(["Low", "Medium", "High"]);
export const ImpactLevelSchema = z.enum(["High", "Medium", "Low"]);

export const RejectionCategorySchema = z.enum([
  "Keyword Match",
  "Experience Match",
  "Project Quality",
  "Technical Depth",
  "Impact Metrics",
  "Resume Structure",
  "Role Alignment",
]);

export const RejectionReasonSchema = z.object({
  title: z.string().min(1),
  severity: SeveritySchema,
  category: RejectionCategorySchema,
  evidence: z.string().min(1),
  explanation: z.string().min(1),
  impact: z.string().min(1),
  recommendation: z.string().min(1),
});

export const RejectionOpportunitySchema = z.object({
  action: z.string().min(1),
  estimatedImpact: ImpactLevelSchema,
  rationale: z.string().optional(),
});

export const RejectionAnalysisSchema = z.object({
  overallRisk: RiskLevelSchema,
  reasons: z.array(RejectionReasonSchema).min(2).max(8),
  opportunities: z.array(RejectionOpportunitySchema).min(2).max(6),
});

export const AnalysisSuggestionSchema = z.object({
  issue: z.string().min(1),
  before: z.string().min(1),
  after: z.string().min(1),
});

/** Full analysis payload returned by the LLM and stored in `analyses.result`. */
export const AnalysisResultSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(AnalysisSuggestionSchema),
  atsKeywords: z.array(z.string()),
  rejectionAnalysis: RejectionAnalysisSchema,
});

/** Parsed result from DB — older rows may lack rejectionAnalysis. */
export const StoredAnalysisResultSchema = AnalysisResultSchema.extend({
  rejectionAnalysis: RejectionAnalysisSchema.optional(),
});

export type Severity = z.infer<typeof SeveritySchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;
export type RejectionCategory = z.infer<typeof RejectionCategorySchema>;
export type RejectionReason = z.infer<typeof RejectionReasonSchema>;
export type RejectionOpportunity = z.infer<typeof RejectionOpportunitySchema>;
export type RejectionAnalysis = z.infer<typeof RejectionAnalysisSchema>;
export type AnalysisSuggestion = z.infer<typeof AnalysisSuggestionSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type StoredAnalysisResult = z.infer<typeof StoredAnalysisResultSchema>;

export function parseAnalysisResultFromLlm(raw: unknown): AnalysisResult {
  return AnalysisResultSchema.parse(raw);
}

export function parseStoredAnalysisResult(raw: unknown): StoredAnalysisResult {
  return StoredAnalysisResultSchema.parse(raw);
}
