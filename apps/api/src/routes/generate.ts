import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { generateCoverLetter, generateInterviewQuestions } from "../lib/groq";

const router: IRouter = Router();

function requireAuth(req: any, res: any): string | null {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return auth.userId;
}

router.post("/generate/cover-letter", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { resumeText, jobDescription } = req.body ?? {};
  if (!resumeText || !jobDescription) {
    res.status(400).json({ error: "resumeText and jobDescription are required" });
    return;
  }

  try {
    const coverLetter = await generateCoverLetter(resumeText, jobDescription);
    res.json({ coverLetter });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Cover letter generation failed");
    res.status(502).json({ error: "Failed to generate cover letter. Please try again." });
  }
});

router.post("/generate/interview-prep", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { resumeText, jobDescription } = req.body ?? {};
  if (!resumeText || !jobDescription) {
    res.status(400).json({ error: "resumeText and jobDescription are required" });
    return;
  }

  try {
    const questions = await generateInterviewQuestions(resumeText, jobDescription);
    res.json({ questions });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Interview prep generation failed");
    res.status(502).json({ error: "Failed to generate interview questions. Please try again." });
  }
});

export default router;
