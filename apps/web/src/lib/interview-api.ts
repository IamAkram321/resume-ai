import { customFetch } from "@resume-ai/api-client-react";

export type InterviewType = "technical" | "behavioral" | "mixed";
export type InterviewStatus = "in_progress" | "completed" | "abandoned";

export interface InterviewRecord {
  id: string;
  userId: string;
  analysisId: string | null;
  resumeText: string;
  targetRole: string | null;
  interviewType: InterviewType;
  status: InterviewStatus;
  plannedQuestions: string[];
  currentQuestionIndex: number;
  followUpUsedByIndex: Record<string, boolean>;
  activeQuestionText: string | null;
  activeQuestionType: string | null;
  activePlannedIndex: number | null;
  turnCount: number;
  tokensUsed: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
  startedAt: string;
  completedAt: string | null;
}

export interface InterviewTurn {
  id: string;
  interviewId: string;
  questionText: string;
  questionType: string;
  userAnswerText: string | null;
  answerAudioUrl: string | null;
  plannedQuestionIndex: number | null;
  turnOrder: number;
  createdAt: string;
}

export interface InterviewReport {
  id: string;
  interviewId: string;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  communicationNotes: string[];
  summaryText: string;
  scoreJustification: string;
  createdAt: string;
}

export interface InterviewDetails extends InterviewRecord {
  turns: InterviewTurn[];
  report: InterviewReport | null;
}

export async function listInterviews(): Promise<InterviewRecord[]> {
  return customFetch<InterviewRecord[]>("/api/interviews");
}

export async function getInterview(id: string): Promise<InterviewDetails> {
  return customFetch<InterviewDetails>(`/api/interviews/${id}`);
}

export async function startInterview(body: {
  analysisId?: string;
  resumeText?: string;
  targetRole?: string;
  interviewType: InterviewType;
}): Promise<{ interview: InterviewRecord; firstQuestion: string }> {
  return customFetch("/api/interviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function submitInterviewAnswer(
  interviewId: string,
  answerText: string,
): Promise<{
  status: "continue" | "completed";
  nextQuestion?: string;
  nextQuestionType?: string;
  interview: InterviewRecord;
  report?: InterviewReport;
}> {
  return customFetch(`/api/interviews/${interviewId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answerText }),
  });
}

export async function completeInterview(id: string): Promise<{
  interview: InterviewRecord;
  report: InterviewReport;
}> {
  return customFetch(`/api/interviews/${id}/complete`, { method: "POST" });
}

export async function abandonInterview(id: string): Promise<{ interview: InterviewRecord }> {
  return customFetch(`/api/interviews/${id}/abandon`, { method: "POST" });
}

export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  const base64 = await blobToBase64(blob);
  const data = await customFetch<{ text: string }>("/api/interviews/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64: base64, mimeType: blob.type || "audio/webm" }),
  });
  return data.text;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
