import Groq from "groq-sdk";
import { logger } from "../logger";
import { parseLlmJson } from "../parseLlmJson";
import {
  parseInterviewReportFromLlm,
  parseNextTurnFromLlm,
  parsePlannedQuestionsFromLlm,
  type InterviewReport,
  type NextTurnDecision,
} from "@resume-ai/api-zod/schemas/interview";
import {
  INTERVIEW_MAX_PLANNED_QUESTIONS,
  INTERVIEW_MIN_PLANNED_QUESTIONS,
  type InterviewType,
} from "../interview-config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const WHISPER_MODEL = "whisper-large-v3";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export const EMPTY_TOKEN_USAGE: TokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

export function extractTokenUsage(completion: {
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}): TokenUsage {
  return {
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
    totalTokens: completion.usage?.total_tokens ?? 0,
  };
}

export function mergeTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}

const INTERVIEWER_PERSONA = `You are a professional interviewer conducting a mock job interview.
Tone: formal, concise, direct — like a real hiring manager. No filler phrases ("Great question!", "Thanks for sharing!", excessive praise).
Ask one question at a time. Keep questions clear and focused.`;

export async function generatePlannedQuestions(
  resumeText: string,
  interviewType: InterviewType,
  targetRole?: string | null,
): Promise<{ questions: string[]; usage: TokenUsage }> {
  const roleContext = targetRole?.trim()
    ? `Target role: ${targetRole.trim()}`
    : "No specific target role — derive questions purely from resume content.";

  const typeGuide =
    interviewType === "technical"
      ? "Focus on technical depth: projects, stack, system design, debugging, trade-offs."
      : interviewType === "behavioral"
        ? "Focus on behavioral: STAR stories, teamwork, conflict, leadership, career narrative."
        : "Mix technical depth (projects/skills) with behavioral (career narrative, gaps, transitions).";

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: `${INTERVIEWER_PERSONA}

Generate ${INTERVIEW_MIN_PLANNED_QUESTIONS}–${INTERVIEW_MAX_PLANNED_QUESTIONS} interview questions for a mock session.
${typeGuide}

Return ONLY JSON: { "questions": ["question 1", "question 2", ...] }
- Each question must reference specific resume content (projects, skills, employers) when possible.
- No duplicate themes. Progress from warm-up to deeper questions.
- Questions only — no tips, no numbering prefix.`,
      },
      {
        role: "user",
        content: `${roleContext}\n\nRESUME:\n${resumeText}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const parsed = parseLlmJson<{ questions: unknown }>(content);
  const questions = parsePlannedQuestionsFromLlm(parsed.questions);

  return { questions, usage: extractTokenUsage(completion) };
}

export interface TurnContext {
  resumeText: string;
  targetRole?: string | null;
  interviewType: InterviewType;
  plannedQuestions: string[];
  currentPlannedIndex: number;
  currentQuestion: string;
  currentQuestionType: "planned" | "follow_up";
  userAnswer: string;
  followUpAlreadyUsed: boolean;
  turnsRemaining: number;
  transcript: Array<{ question: string; answer: string }>;
}

export async function decideNextTurn(ctx: TurnContext): Promise<{
  decision: NextTurnDecision;
  usage: TokenUsage;
}> {
  const transcriptBlock = ctx.transcript
    .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`)
    .join("\n\n");

  const nextPlanned =
    ctx.currentPlannedIndex + 1 < ctx.plannedQuestions.length
      ? ctx.plannedQuestions[ctx.currentPlannedIndex + 1]
      : null;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `${INTERVIEWER_PERSONA}

After the candidate's answer, decide the next step.

Return ONLY JSON:
{
  "action": "follow_up" | "next" | "complete",
  "nextQuestionText": "<next question if action is follow_up or next; omit if complete>"
}

Rules:
- Use "follow_up" ONLY if the answer was vague/incomplete AND no follow-up was used for this planned question yet AND a targeted clarifying question would help. Max one follow-up per planned question (followUpAlreadyUsed=${ctx.followUpAlreadyUsed}).
- Use "next" to advance to the next planned question when the answer was adequate OR follow-up already used.
- Use "complete" when ${ctx.turnsRemaining} turns remain OR no meaningful follow-up is needed and no more planned questions fit the session.
- nextQuestionText must be a single professional interview question — no preamble.
- If action is "next" and a planned question is provided below, you may use it verbatim or adapt slightly.

Next planned question (if advancing): ${nextPlanned ?? "none"}`,
      },
      {
        role: "user",
        content: `Target role: ${ctx.targetRole ?? "General"}\nInterview type: ${ctx.interviewType}\n\nCurrent question (${ctx.currentQuestionType}): ${ctx.currentQuestion}\n\nCandidate answer:\n${ctx.userAnswer}\n\nPrior transcript:\n${transcriptBlock || "(first answer)"}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const raw = parseLlmJson<unknown>(content);
  let decision = parseNextTurnFromLlm(raw);

  if (decision.action === "follow_up" && ctx.followUpAlreadyUsed) {
    decision = nextPlanned
      ? { action: "next", nextQuestionText: nextPlanned }
      : { action: "complete" };
  }

  if (decision.action === "next" && !decision.nextQuestionText && nextPlanned) {
    decision = { action: "next", nextQuestionText: nextPlanned };
  }

  if (decision.action !== "complete" && ctx.turnsRemaining <= 0) {
    decision = { action: "complete" };
  }

  return { decision, usage: extractTokenUsage(completion) };
}

export async function generateInterviewReport(
  resumeText: string,
  targetRole: string | null | undefined,
  transcript: Array<{ question: string; answer: string; questionType: string }>,
): Promise<{ report: InterviewReport; usage: TokenUsage }> {
  const transcriptText = transcript
    .map(
      (t, i) =>
        `[Turn ${i + 1}] (${t.questionType})\nQ: ${t.question}\nA: ${t.answer}`,
    )
    .join("\n\n");

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are an expert interview coach. Analyze the mock interview transcript and produce actionable feedback.

Return ONLY JSON:
{
  "overallScore": <integer 1-10>,
  "scoreJustification": "<one sentence>",
  "strengths": ["<3-5 bullets citing specific transcript moments>"],
  "weaknesses": ["<3-5 specific actionable bullets>"],
  "improvementAreas": ["<concrete next steps>"],
  "communicationNotes": ["<filler words, pacing, rambling, clarity observations>"],
  "summaryText": "<2-3 sentence overall summary>"
}

Be specific — cite moments from the transcript. No generic advice.`,
      },
      {
        role: "user",
        content: `Target role: ${targetRole ?? "General"}\n\nRESUME:\n${resumeText}\n\nTRANSCRIPT:\n${transcriptText}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const report = parseInterviewReportFromLlm(parseLlmJson(content));

  return { report, usage: extractTokenUsage(completion) };
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
): Promise<{ text: string; usage: TokenUsage }> {
  const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("wav") ? "wav" : "mp3";
  const file = new File([audioBuffer], `answer.${ext}`, { type: mimeType });

  const result = await groq.audio.transcriptions.create({
    file,
    model: WHISPER_MODEL,
    response_format: "json",
    language: "en",
  });

  const text = (result.text ?? "").trim();
  if (!text) throw new Error("Transcription returned empty text");

  logger.info({ chars: text.length }, "Whisper transcription completed");

  return {
    text,
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };
}
