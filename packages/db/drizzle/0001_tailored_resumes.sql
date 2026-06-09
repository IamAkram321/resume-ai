CREATE TABLE IF NOT EXISTS "tailored_resumes" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "analysis_id" text,
  "original_resume" text NOT NULL,
  "tailored_resume" text NOT NULL,
  "job_description" text NOT NULL,
  "target_role" text,
  "ats_before" integer NOT NULL,
  "ats_after" integer NOT NULL,
  "result" json NOT NULL,
  "label" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
