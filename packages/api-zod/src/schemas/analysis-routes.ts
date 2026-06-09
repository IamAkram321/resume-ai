import { z } from "zod";
import { ResumeLayoutSchema } from "./resume-layout";

export const CreateAnalysisBody = z.object({
  resumeText: z.string(),
  jobDescription: z.string(),
  resumeLayout: ResumeLayoutSchema.optional(),
});
