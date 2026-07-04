/** Mock interview session limits — single source of truth. */
export const INTERVIEW_MIN_PLANNED_QUESTIONS = 6;
export const INTERVIEW_MAX_PLANNED_QUESTIONS = 10;
export const INTERVIEW_MAX_DURATION_MS = 20 * 60 * 1000;
export const INTERVIEW_MAX_FOLLOW_UPS_PER_QUESTION = 1;

export type InterviewType = "technical" | "behavioral" | "mixed";
export type InterviewStatus = "in_progress" | "completed" | "abandoned";
export type QuestionType = "planned" | "follow_up";

export const INTERVIEW_TYPES: InterviewType[] = ["technical", "behavioral", "mixed"];
