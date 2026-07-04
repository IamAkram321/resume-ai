import { randomUUID } from "crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  analysesTable,
  interviewsTable,
  interviewTurnsTable,
  interviewReportsTable,
  type Interview,
  type InterviewReport,
  type InterviewTurn,
} from "@resume-ai/db";
import {
  INTERVIEW_MAX_DURATION_MS,
  INTERVIEW_MAX_PLANNED_QUESTIONS,
  type InterviewType,
  type QuestionType,
} from "../interview-config";
import {
  decideNextTurn,
  generateInterviewReport,
  generatePlannedQuestions,
  mergeTokenUsage,
  EMPTY_TOKEN_USAGE,
  type TokenUsage,
} from "./groq-interview";

export interface InterviewWithDetails extends Interview {
  turns: InterviewTurn[];
  report: InterviewReport | null;
}

function isDurationExceeded(interview: Interview): boolean {
  const elapsed = Date.now() - new Date(interview.startedAt).getTime();
  return elapsed >= INTERVIEW_MAX_DURATION_MS;
}

function plannedQuestionsAnswered(interview: Interview): number {
  return interview.currentQuestionIndex;
}

function maxTurnsRemaining(interview: Interview): number {
  const answered = plannedQuestionsAnswered(interview);
  return Math.max(0, interview.plannedQuestions.length - answered);
}

async function loadTranscript(interviewId: string): Promise<
  Array<{ question: string; answer: string; questionType: string }>
> {
  const turns = await db
    .select()
    .from(interviewTurnsTable)
    .where(eq(interviewTurnsTable.interviewId, interviewId))
    .orderBy(asc(interviewTurnsTable.turnOrder));

  return turns
    .filter((t) => t.userAnswerText)
    .map((t) => ({
      question: t.questionText,
      answer: t.userAnswerText!,
      questionType: t.questionType,
    }));
}

async function appendTokens(interviewId: string, usage: TokenUsage): Promise<void> {
  const [row] = await db
    .select({ tokensUsed: interviewsTable.tokensUsed })
    .from(interviewsTable)
    .where(eq(interviewsTable.id, interviewId));

  const merged = mergeTokenUsage(row?.tokensUsed ?? EMPTY_TOKEN_USAGE, usage);
  await db
    .update(interviewsTable)
    .set({ tokensUsed: merged })
    .where(eq(interviewsTable.id, interviewId));
}

export async function resolveResumeText(
  userId: string,
  analysisId?: string,
  resumeText?: string,
): Promise<string> {
  if (analysisId) {
    const [analysis] = await db
      .select({ resumeText: analysesTable.resumeText })
      .from(analysesTable)
      .where(and(eq(analysesTable.id, analysisId), eq(analysesTable.userId, userId)));

    if (!analysis) throw new InterviewError("Analysis not found.", 404);
    return analysis.resumeText;
  }

  const text = resumeText?.trim();
  if (!text || text.length < 50) {
    throw new InterviewError("Resume text must be at least 50 characters.", 400);
  }
  return text;
}

export class InterviewError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "InterviewError";
  }
}

export async function startInterview(params: {
  userId: string;
  analysisId?: string;
  resumeText?: string;
  targetRole?: string;
  interviewType: InterviewType;
}): Promise<{ interview: Interview; firstQuestion: string }> {
  const resume = await resolveResumeText(
    params.userId,
    params.analysisId,
    params.resumeText,
  );

  const { questions, usage } = await generatePlannedQuestions(
    resume,
    params.interviewType,
    params.targetRole,
  );

  const id = randomUUID();
  const firstQuestion = questions[0];

  const [interview] = await db
    .insert(interviewsTable)
    .values({
      id,
      userId: params.userId,
      analysisId: params.analysisId ?? null,
      resumeText: resume,
      targetRole: params.targetRole?.trim() || null,
      interviewType: params.interviewType,
      status: "in_progress",
      plannedQuestions: questions.slice(0, INTERVIEW_MAX_PLANNED_QUESTIONS),
      currentQuestionIndex: 0,
      followUpUsedByIndex: {},
      activeQuestionText: firstQuestion,
      activeQuestionType: "planned",
      activePlannedIndex: 0,
      turnCount: 0,
      tokensUsed: usage,
    })
    .returning();

  return { interview, firstQuestion };
}

export async function getInterviewForUser(
  interviewId: string,
  userId: string,
): Promise<InterviewWithDetails | null> {
  const [interview] = await db
    .select()
    .from(interviewsTable)
    .where(and(eq(interviewsTable.id, interviewId), eq(interviewsTable.userId, userId)));

  if (!interview) return null;

  const turns = await db
    .select()
    .from(interviewTurnsTable)
    .where(eq(interviewTurnsTable.interviewId, interviewId))
    .orderBy(asc(interviewTurnsTable.turnOrder));

  const [report] = await db
    .select()
    .from(interviewReportsTable)
    .where(eq(interviewReportsTable.interviewId, interviewId));

  return { ...interview, turns, report: report ?? null };
}

export async function listInterviewsForUser(userId: string): Promise<Interview[]> {
  return db
    .select()
    .from(interviewsTable)
    .where(eq(interviewsTable.userId, userId))
    .orderBy(desc(interviewsTable.startedAt))
    .limit(50);
}

async function finalizeInterview(
  interview: Interview,
): Promise<{ interview: Interview; report: InterviewReport }> {
  const transcript = await loadTranscript(interview.id);

  if (transcript.length === 0) {
    throw new InterviewError("Cannot generate report without any answered questions.", 400);
  }

  const { report: reportData, usage } = await generateInterviewReport(
    interview.resumeText,
    interview.targetRole,
    transcript,
  );
  await appendTokens(interview.id, usage);

  const reportId = randomUUID();
  const [report] = await db
    .insert(interviewReportsTable)
    .values({
      id: reportId,
      interviewId: interview.id,
      overallScore: reportData.overallScore,
      strengths: reportData.strengths,
      weaknesses: reportData.weaknesses,
      improvementAreas: reportData.improvementAreas,
      communicationNotes: reportData.communicationNotes,
      summaryText: reportData.summaryText,
      scoreJustification: reportData.scoreJustification,
    })
    .returning();

  const [updated] = await db
    .update(interviewsTable)
    .set({
      status: "completed",
      completedAt: new Date(),
      activeQuestionText: null,
      activeQuestionType: null,
    })
    .where(eq(interviewsTable.id, interview.id))
    .returning();

  return { interview: updated, report };
}

export interface SubmitAnswerResult {
  status: "continue" | "completed";
  nextQuestion?: string;
  nextQuestionType?: QuestionType;
  interview: Interview;
  report?: InterviewReport;
}

export async function submitAnswer(
  interviewId: string,
  userId: string,
  answerText: string,
): Promise<SubmitAnswerResult> {
  const details = await getInterviewForUser(interviewId, userId);
  if (!details) throw new InterviewError("Interview not found.", 404);
  if (details.status !== "in_progress") {
    throw new InterviewError("Interview is not in progress.", 400);
  }

  const interview = details;
  if (!interview.activeQuestionText || interview.activePlannedIndex == null) {
    throw new InterviewError("No active question.", 400);
  }

  const turnOrder = interview.turnCount + 1;
  await db.insert(interviewTurnsTable).values({
    id: randomUUID(),
    interviewId: interview.id,
    questionText: interview.activeQuestionText,
    questionType: interview.activeQuestionType ?? "planned",
    userAnswerText: answerText.trim(),
    answerAudioUrl: null,
    plannedQuestionIndex: interview.activePlannedIndex,
    turnOrder,
  });

  const newTurnCount = turnOrder;
  await db
    .update(interviewsTable)
    .set({ turnCount: newTurnCount })
    .where(eq(interviewsTable.id, interview.id));

  if (isDurationExceeded(interview)) {
    const { interview: completed, report } = await finalizeInterview({
      ...interview,
      turnCount: newTurnCount,
    });
    return { status: "completed", interview: completed, report };
  }

  const transcript = await loadTranscript(interview.id);
  const idx = interview.activePlannedIndex;
  const followUpKey = String(idx);
  const followUpUsed = !!interview.followUpUsedByIndex[followUpKey];

  const { decision, usage } = await decideNextTurn({
    resumeText: interview.resumeText,
    targetRole: interview.targetRole,
    interviewType: interview.interviewType as InterviewType,
    plannedQuestions: interview.plannedQuestions,
    currentPlannedIndex: idx,
    currentQuestion: interview.activeQuestionText,
    currentQuestionType: (interview.activeQuestionType ?? "planned") as "planned" | "follow_up",
    userAnswer: answerText.trim(),
    followUpAlreadyUsed: followUpUsed,
    turnsRemaining: maxTurnsRemaining(interview),
    transcript: transcript.map((t) => ({ question: t.question, answer: t.answer })),
  });
  await appendTokens(interview.id, usage);

  if (decision.action === "complete") {
    const { interview: completed, report } = await finalizeInterview({
      ...interview,
      turnCount: newTurnCount,
    });
    return { status: "completed", interview: completed, report };
  }

  if (decision.action === "follow_up") {
    const followUpUsedByIndex = {
      ...interview.followUpUsedByIndex,
      [followUpKey]: true,
    };
    const [updated] = await db
      .update(interviewsTable)
      .set({
        activeQuestionText: decision.nextQuestionText!,
        activeQuestionType: "follow_up",
        followUpUsedByIndex,
      })
      .where(eq(interviewsTable.id, interview.id))
      .returning();

    return {
      status: "continue",
      nextQuestion: decision.nextQuestionText,
      nextQuestionType: "follow_up",
      interview: updated,
    };
  }

  const nextIndex = idx + 1;
  if (nextIndex >= interview.plannedQuestions.length) {
    const { interview: completed, report } = await finalizeInterview({
      ...interview,
      turnCount: newTurnCount,
    });
    return { status: "completed", interview: completed, report };
  }

  const nextQuestion =
    decision.nextQuestionText ?? interview.plannedQuestions[nextIndex];

  const [updated] = await db
    .update(interviewsTable)
    .set({
      currentQuestionIndex: nextIndex,
      activeQuestionText: nextQuestion,
      activeQuestionType: "planned",
      activePlannedIndex: nextIndex,
    })
    .where(eq(interviewsTable.id, interview.id))
    .returning();

  return {
    status: "continue",
    nextQuestion,
    nextQuestionType: "planned",
    interview: updated,
  };
}

export async function completeInterview(
  interviewId: string,
  userId: string,
): Promise<{ interview: Interview; report: InterviewReport }> {
  const details = await getInterviewForUser(interviewId, userId);
  if (!details) throw new InterviewError("Interview not found.", 404);
  if (details.status === "completed" && details.report) {
    return { interview: details, report: details.report };
  }
  if (details.status !== "in_progress") {
    throw new InterviewError("Interview cannot be completed.", 400);
  }
  return finalizeInterview(details);
}

export async function abandonInterview(
  interviewId: string,
  userId: string,
): Promise<Interview> {
  const details = await getInterviewForUser(interviewId, userId);
  if (!details) throw new InterviewError("Interview not found.", 404);
  if (details.status !== "in_progress") {
    throw new InterviewError("Interview is not in progress.", 400);
  }

  const [updated] = await db
    .update(interviewsTable)
    .set({
      status: "abandoned",
      completedAt: new Date(),
      activeQuestionText: null,
      activeQuestionType: null,
    })
    .where(eq(interviewsTable.id, interviewId))
    .returning();

  return updated;
}
