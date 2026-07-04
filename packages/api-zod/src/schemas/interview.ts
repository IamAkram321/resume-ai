import { z } from "zod";

export const InterviewTypeSchema = z.enum(["technical", "behavioral", "mixed"]);

export const StartInterviewBody = z.object({
  analysisId: z.string().uuid().optional(),
  resumeText: z.string().min(50).max(50_000).optional(),
  targetRole: z.string().max(200).optional(),
  interviewType: InterviewTypeSchema.default("mixed"),
}).refine(
  (d) => d.analysisId || (d.resumeText && d.resumeText.trim().length >= 50),
  { message: "Either analysisId or resumeText (min 50 chars) is required." },
);

export const SubmitAnswerBody = z.object({
  answerText: z.string().min(1).max(20_000),
});

export const TranscribeBody = z.object({
  audioBase64: z.string().min(1).max(7_000_000),
  mimeType: z.string().default("audio/webm"),
});

export const InterviewParams = z.object({
  id: z.string().uuid(),
});

export const InterviewReportSchema = z.object({
  overallScore: z.number().int().min(1).max(10),
  scoreJustification: z.string(),
  strengths: z.array(z.string()).min(3).max(5),
  weaknesses: z.array(z.string()).min(3).max(5),
  improvementAreas: z.array(z.string()).min(2).max(6),
  communicationNotes: z.array(z.string()).min(1).max(6),
  summaryText: z.string(),
});

export const NextTurnDecisionSchema = z.object({
  action: z.enum(["follow_up", "next", "complete"]),
  nextQuestionText: z.string().optional(),
});

export const PlannedQuestionsSchema = z.object({
  questions: z.array(z.string()).min(6).max(10),
});

export type InterviewReport = z.infer<typeof InterviewReportSchema>;
export type NextTurnDecision = z.infer<typeof NextTurnDecisionSchema>;

export function parseInterviewReportFromLlm(raw: unknown): InterviewReport {
  return InterviewReportSchema.parse(raw);
}

export function parseNextTurnFromLlm(raw: unknown): NextTurnDecision {
  const parsed = NextTurnDecisionSchema.parse(raw);
  if (parsed.action !== "complete" && !parsed.nextQuestionText?.trim()) {
    throw new Error("nextQuestionText required when action is follow_up or next");
  }
  return parsed;
}

export function parsePlannedQuestionsFromLlm(raw: unknown): string[] {
  const arr = z.array(z.string()).parse(raw);
  if (arr.length < 6) throw new Error("Expected at least 6 planned questions");
  return arr.slice(0, 10);
}
