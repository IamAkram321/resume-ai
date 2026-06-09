ALTER TABLE "analyses" ADD COLUMN IF NOT EXISTS "resume_layout" json;
ALTER TABLE "tailored_resumes" ADD COLUMN IF NOT EXISTS "resume_layout" json;
