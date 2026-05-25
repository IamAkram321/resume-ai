import { pgTable, text, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  resumeText: text("resume_text").notNull(),
  jobDescription: text("job_description").notNull(),
  score: integer("score").notNull(),
  result: json("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
