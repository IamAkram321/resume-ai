import { pgTable, text, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tailoredResumesTable = pgTable("tailored_resumes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  analysisId: text("analysis_id"),
  originalResume: text("original_resume").notNull(),
  tailoredResume: text("tailored_resume").notNull(),
  jobDescription: text("job_description").notNull(),
  targetRole: text("target_role"),
  atsBefore: integer("ats_before").notNull(),
  atsAfter: integer("ats_after").notNull(),
  result: json("result").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTailoredResumeSchema = createInsertSchema(tailoredResumesTable).omit({
  createdAt: true,
});
export type InsertTailoredResume = z.infer<typeof insertTailoredResumeSchema>;
export type TailoredResume = typeof tailoredResumesTable.$inferSelect;
