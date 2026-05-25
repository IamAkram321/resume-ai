import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { generateCoverLetter, generateInterviewQuestions } from "../lib/groq";
import { getOrCreateUser } from "../lib/users";

const router: IRouter = Router();

const MIN_LEN = 50;
const MAX_LEN = 50_000;

function validateInput(body: unknown): { resumeText: string; jobDescription: string } | null {
  if (!body || typeof body !== "object") return null;
  const { resumeText, jobDescription } = body as Record<string, unknown>;
  if (typeof resumeText !== "string" || typeof jobDescription !== "string") return null;
  const r = resumeText.trim();
  const j = jobDescription.trim();
  if (r.length < MIN_LEN || j.length < MIN_LEN) return null;
  if (r.length > MAX_LEN || j.length > MAX_LEN) return null;
  return { resumeText: r, jobDescription: j };
}

router.post("/generate/cover-letter", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(auth.userId);
  if (user.tier !== "pro") {
    res.status(403).json({ error: "Cover letter generation requires a Pro subscription." });
    return;
  }

  const input = validateInput(req.body);
  if (!input) {
    res.status(400).json({
      error: "resumeText and jobDescription are required (min 50 characters each).",
    });
    return;
  }

  try {
    const coverLetter = await generateCoverLetter(input.resumeText, input.jobDescription);
    res.json({ coverLetter });
  } catch (err: unknown) {
    req.log.error({ err }, "Cover letter generation failed");
    res.status(502).json({ error: "Failed to generate cover letter. Please try again." });
  }
});

router.post("/generate/interview-prep", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(auth.userId);
  if (user.tier !== "pro") {
    res.status(403).json({ error: "Interview prep requires a Pro subscription." });
    return;
  }

  const input = validateInput(req.body);
  if (!input) {
    res.status(400).json({
      error: "resumeText and jobDescription are required (min 50 characters each).",
    });
    return;
  }

  try {
    const questions = await generateInterviewQuestions(
      input.resumeText,
      input.jobDescription,
    );
    res.json({ questions });
  } catch (err: unknown) {
    req.log.error({ err }, "Interview prep generation failed");
    res.status(502).json({ error: "Failed to generate interview questions. Please try again." });
  }
});

export default router;
