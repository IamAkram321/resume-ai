import { z } from "zod";

export const CreateTailoredResumeBody = z.object({
  analysisId: z.string().uuid().optional(),
  resumeText: z.string().min(50).max(50_000).optional(),
  jobDescription: z.string().min(50).max(50_000).optional(),
  label: z.string().max(120).optional(),
});

export const TailoredResumeParams = z.object({
  id: z.string().uuid(),
});

export const UpdateTailoredResumeLabelBody = z.object({
  label: z.string().min(1).max(120),
});
