import express, { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, desc, and } from "drizzle-orm";
import { db, analysesTable, tailoredResumesTable } from "@resume-ai/db";
import { getOrCreateUser } from "../lib/users";
import { generateTailoredResume } from "../lib/groq";
import { mapLlmErrorToResponse } from "../lib/llm-errors";
import {
  checkFeatureQuota,
  consumeFeatureQuota,
  featureLimitError,
  getUsageSummary,
} from "../lib/feature-usage";
import { parseStoredAnalysisResult } from "@resume-ai/api-zod/schemas/analysis-result";
import {
  CreateTailoredResumeBody,
  TailoredResumeParams,
  UpdateTailoredResumeLabelBody,
} from "@resume-ai/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

async function requireUser(req: express.Request, res: express.Response): Promise<string | null> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return clerkUserId;
}

router.get("/tailored-resumes/usage", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const user = await getOrCreateUser(clerkUserId);
  const summary = await getUsageSummary(user.id, user.tier === "pro");
  const tailor = summary.features.find((f) => f.key === "tailor")!;
  res.json({
    used: tailor.used,
    limit: tailor.limit,
    remaining: tailor.remaining,
    isPro: summary.isPro,
  });
});

router.get("/tailored-resumes", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const user = await getOrCreateUser(clerkUserId);
  const isPro = user.tier === "pro";
  const limit = isPro ? 50 : 5;

  const rows = await db
    .select()
    .from(tailoredResumesTable)
    .where(eq(tailoredResumesTable.userId, user.id))
    .orderBy(desc(tailoredResumesTable.createdAt))
    .limit(limit);

  res.json(rows);
});

router.post("/tailored-resumes", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const parsed = CreateTailoredResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);
  const isPro = user.tier === "pro";

  const quota = await checkFeatureQuota(user.id, "tailor", isPro);
  if (!quota.allowed) {
    const { status, body } = featureLimitError("tailor", quota);
    res.status(status).json(body);
    return;
  }

  let resumeText = parsed.data.resumeText?.trim() ?? "";
  let jobDescription = parsed.data.jobDescription?.trim() ?? "";
  let analysisScore: number | undefined;
  let storedAnalysis = null;

  if (parsed.data.analysisId) {
    const [analysis] = await db
      .select()
      .from(analysesTable)
      .where(
        and(
          eq(analysesTable.id, parsed.data.analysisId),
          eq(analysesTable.userId, user.id),
        ),
      );

    if (!analysis) {
      res.status(404).json({ error: "Analysis not found" });
      return;
    }

    resumeText = analysis.resumeText;
    jobDescription = analysis.jobDescription;
    analysisScore = analysis.score;
    storedAnalysis = parseStoredAnalysisResult(analysis.result);
  }

  if (resumeText.length < 50 || jobDescription.length < 50) {
    res.status(400).json({
      error: "Provide analysisId or both resumeText and jobDescription (min 50 characters each).",
    });
    return;
  }

  try {
    const tailoring = await generateTailoredResume(resumeText, jobDescription, storedAnalysis);

    const metrics =
      analysisScore != null
        ? { ...tailoring.metrics, atsBefore: analysisScore }
        : tailoring.metrics;
    const tailoringRecord = { ...tailoring, metrics };

    const id = randomUUID();
    const label =
      parsed.data.label?.trim() ||
      tailoringRecord.targetRole ||
      `Tailored · ATS ${metrics.atsAfter}`;

    const [row] = await db
      .insert(tailoredResumesTable)
      .values({
        id,
        userId: user.id,
        analysisId: parsed.data.analysisId ?? null,
        originalResume: resumeText,
        tailoredResume: tailoringRecord.tailoredResume,
        jobDescription,
        targetRole: tailoringRecord.targetRole ?? null,
        atsBefore: metrics.atsBefore,
        atsAfter: metrics.atsAfter,
        result: tailoringRecord,
        label,
      })
      .returning();

    await consumeFeatureQuota(user.id, "tailor", isPro);

    res.status(201).json(row);
  } catch (err: unknown) {
    req.log.error({ err }, "Tailoring failed");
    const { status, body } = mapLlmErrorToResponse(
      err,
      "Resume tailoring failed. Please try again.",
    );
    res.status(status).json(body);
  }
});

router.get("/tailored-resumes/:id", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const params = TailoredResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);

  const [row] = await db
    .select()
    .from(tailoredResumesTable)
    .where(
      and(
        eq(tailoredResumesTable.id, params.data.id),
        eq(tailoredResumesTable.userId, user.id),
      ),
    );

  if (!row) {
    res.status(404).json({ error: "Tailored resume not found" });
    return;
  }

  res.json(row);
});

router.patch("/tailored-resumes/:id", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const user = await getOrCreateUser(clerkUserId);
  if (user.tier !== "pro") {
    res.status(403).json({ error: "Saving version labels requires Pro." });
    return;
  }

  const params = TailoredResumeParams.safeParse(req.params);
  const body = UpdateTailoredResumeLabelBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [updated] = await db
    .update(tailoredResumesTable)
    .set({ label: body.data.label })
    .where(
      and(
        eq(tailoredResumesTable.id, params.data.id),
        eq(tailoredResumesTable.userId, user.id),
      ),
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Tailored resume not found" });
    return;
  }

  res.json(updated);
});

router.delete("/tailored-resumes/:id", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const params = TailoredResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);

  const [deleted] = await db
    .delete(tailoredResumesTable)
    .where(
      and(
        eq(tailoredResumesTable.id, params.data.id),
        eq(tailoredResumesTable.userId, user.id),
      ),
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Tailored resume not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
