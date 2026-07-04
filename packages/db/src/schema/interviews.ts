import { pgTable, text, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interviewsTable = pgTable("interviews", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  analysisId: text("analysis_id"),
  resumeText: text("resume_text").notNull(),
  targetRole: text("target_role"),
  interviewType: text("interview_type").notNull(),
  status: text("status").notNull().default("in_progress"),
  plannedQuestions: json("planned_questions").$type<string[]>().notNull(),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  followUpUsedByIndex: json("follow_up_used_by_index").$type<Record<string, boolean>>().notNull().default({}),
  activeQuestionText: text("active_question_text"),
  activeQuestionType: text("active_question_type"),
  activePlannedIndex: integer("active_planned_index"),
  turnCount: integer("turn_count").notNull().default(0),
  tokensUsed: json("tokens_used").$type<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }>(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const interviewTurnsTable = pgTable("interview_turns", {
  id: text("id").primaryKey(),
  interviewId: text("interview_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  userAnswerText: text("user_answer_text"),
  answerAudioUrl: text("answer_audio_url"),
  plannedQuestionIndex: integer("planned_question_index"),
  turnOrder: integer("turn_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const interviewReportsTable = pgTable("interview_reports", {
  id: text("id").primaryKey(),
  interviewId: text("interview_id").notNull().unique(),
  overallScore: integer("overall_score").notNull(),
  strengths: json("strengths").$type<string[]>().notNull(),
  weaknesses: json("weaknesses").$type<string[]>().notNull(),
  improvementAreas: json("improvement_areas").$type<string[]>().notNull(),
  communicationNotes: json("communication_notes").$type<string[]>().notNull(),
  summaryText: text("summary_text").notNull(),
  scoreJustification: text("score_justification").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInterviewSchema = createInsertSchema(interviewsTable).omit({
  startedAt: true,
  completedAt: true,
});
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviewsTable.$inferSelect;
export type InterviewTurn = typeof interviewTurnsTable.$inferSelect;
export type InterviewReport = typeof interviewReportsTable.$inferSelect;
