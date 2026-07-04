import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import {
  StartInterviewBody,
  SubmitAnswerBody,
  TranscribeBody,
  InterviewParams,
} from "@resume-ai/api-zod/schemas/interview";
import {
  abandonInterview,
  completeInterview,
  getInterviewForUser,
  InterviewError,
  listInterviewsForUser,
  startInterview,
  submitAnswer,
} from "../lib/interview/service";
import { transcribeAudio } from "../lib/interview/groq-interview";
import { mapLlmErrorToResponse } from "../lib/llm-errors";
import {
  checkFeatureQuota,
  consumeFeatureQuota,
  featureLimitError,
} from "../lib/feature-usage";
import { getOrCreateUser } from "../lib/users";
import { INTERVIEW_TYPES } from "../lib/interview-config";

const router: IRouter = Router();

async function requireUser(req: Request, res: Response) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const user = await getOrCreateUser(auth.userId);
  return user;
}

function handleInterviewError(err: unknown, req: Request, res: Response, fallback: string) {
  if (err instanceof InterviewError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  req.log.error({ err }, fallback);
  const { status, body } = mapLlmErrorToResponse(err, fallback);
  res.status(status).json(body);
}

router.get("/interviews", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const interviews = await listInterviewsForUser(user.id);
  res.json(interviews);
});

router.get("/interviews/:id", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const params = InterviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid interview id." });
    return;
  }

  const interview = await getInterviewForUser(params.data.id, user.id);
  if (!interview) {
    res.status(404).json({ error: "Interview not found." });
    return;
  }

  res.json(interview);
});

router.post("/interviews", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parsed = StartInterviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!INTERVIEW_TYPES.includes(parsed.data.interviewType)) {
    res.status(400).json({ error: "Invalid interview type." });
    return;
  }

  const isPro = user.tier === "pro";
  const quota = await checkFeatureQuota(user.id, "mock_interview", isPro);
  if (!quota.allowed) {
    const { status, body } = featureLimitError("mock_interview", quota);
    res.status(status).json(body);
    return;
  }

  try {
    const { interview, firstQuestion } = await startInterview({
      userId: user.id,
      analysisId: parsed.data.analysisId,
      resumeText: parsed.data.resumeText,
      targetRole: parsed.data.targetRole,
      interviewType: parsed.data.interviewType,
    });

    await consumeFeatureQuota(user.id, "mock_interview", isPro);

    req.log.info(
      { interviewId: interview.id, tokens: interview.tokensUsed },
      "Mock interview started",
    );

    res.status(201).json({
      interview,
      firstQuestion,
    });
  } catch (err) {
    handleInterviewError(err, req, res, "Failed to start interview.");
  }
});

router.post("/interviews/:id/answer", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const params = InterviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid interview id." });
    return;
  }

  const body = SubmitAnswerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  try {
    const result = await submitAnswer(params.data.id, user.id, body.data.answerText);

    req.log.info(
      {
        interviewId: params.data.id,
        status: result.status,
        tokens: result.interview.tokensUsed,
      },
      "Interview answer processed",
    );

    res.json(result);
  } catch (err) {
    handleInterviewError(err, req, res, "Failed to process answer.");
  }
});

router.post("/interviews/:id/complete", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const params = InterviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid interview id." });
    return;
  }

  try {
    const result = await completeInterview(params.data.id, user.id);
    res.json(result);
  } catch (err) {
    handleInterviewError(err, req, res, "Failed to complete interview.");
  }
});

router.post("/interviews/:id/abandon", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const params = InterviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid interview id." });
    return;
  }

  try {
    const interview = await abandonInterview(params.data.id, user.id);
    res.json({ interview });
  } catch (err) {
    handleInterviewError(err, req, res, "Failed to abandon interview.");
  }
});

router.post("/interviews/transcribe", async (req, res): Promise<void> => {
  const user = await requireUser(req, res);
  if (!user) return;

  const parsed = TranscribeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const buffer = Buffer.from(parsed.data.audioBase64, "base64");
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: "Audio file too large (max 5MB)." });
      return;
    }

    const { text } = await transcribeAudio(buffer, parsed.data.mimeType);
    res.json({ text });
  } catch (err) {
    handleInterviewError(err, req, res, "Transcription failed.");
  }
});

export default router;
