CREATE TABLE IF NOT EXISTS "interviews" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "analysis_id" text,
  "resume_text" text NOT NULL,
  "target_role" text,
  "interview_type" text NOT NULL,
  "status" text NOT NULL DEFAULT 'in_progress',
  "planned_questions" json NOT NULL,
  "current_question_index" integer NOT NULL DEFAULT 0,
  "follow_up_used_by_index" json NOT NULL DEFAULT '{}',
  "active_question_text" text,
  "active_question_type" text,
  "active_planned_index" integer,
  "turn_count" integer NOT NULL DEFAULT 0,
  "tokens_used" json,
  "started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "interview_turns" (
  "id" text PRIMARY KEY NOT NULL,
  "interview_id" text NOT NULL,
  "question_text" text NOT NULL,
  "question_type" text NOT NULL,
  "user_answer_text" text,
  "answer_audio_url" text,
  "planned_question_index" integer,
  "turn_order" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "interview_reports" (
  "id" text PRIMARY KEY NOT NULL,
  "interview_id" text NOT NULL UNIQUE,
  "overall_score" integer NOT NULL,
  "strengths" json NOT NULL,
  "weaknesses" json NOT NULL,
  "improvement_areas" json NOT NULL,
  "communication_notes" json NOT NULL,
  "summary_text" text NOT NULL,
  "score_justification" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "interviews_user_id_idx" ON "interviews" ("user_id");
CREATE INDEX IF NOT EXISTS "interview_turns_interview_id_idx" ON "interview_turns" ("interview_id");
