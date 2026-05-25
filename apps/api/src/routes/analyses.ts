import express, { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, desc, and, gte, avg, count } from "drizzle-orm";
import { db, usersTable, analysesTable } from "@resume-ai/db";
import { checkRateLimit, incrementRateLimit } from "../lib/redis";
import { analyzeResume } from "../lib/groq";
import { getOrCreateUser } from "../lib/users";
import { CreateAnalysisBody, GetAnalysisParams, DeleteAnalysisParams } from "@resume-ai/api-zod";
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

router.get("/analyses", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const user = await getOrCreateUser(clerkUserId);
  const isPro = user.tier === "pro";
  const limit = isPro ? 20 : 3;

  const analyses = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.userId, user.id))
    .orderBy(desc(analysesTable.createdAt))
    .limit(limit);

  res.json(analyses);
});

router.post("/analyses", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const resumeText = parsed.data.resumeText.trim();
  const jobDescription = parsed.data.jobDescription.trim();
  if (resumeText.length < 50 || jobDescription.length < 50) {
    res.status(400).json({ error: "Resume and job description must each be at least 50 characters." });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);
  const isPro = user.tier === "pro";

  if (!isPro) {
    const { allowed } = await checkRateLimit(clerkUserId);
    if (!allowed) {
      res.status(429).json({
        error: "Daily limit reached. Upgrade to Pro.",
        remaining: 0,
      });
      return;
    }
  }

  try {
    const result = await analyzeResume(resumeText, jobDescription);

    const [analysis] = await db
      .insert(analysesTable)
      .values({
        id: randomUUID(),
        userId: user.id,
        resumeText,
        jobDescription,
        score: result.score,
        result,
      })
      .returning();

    if (!isPro) {
      await incrementRateLimit(clerkUserId);
    }

    res.status(201).json(analysis);
  } catch (err: unknown) {
    req.log.error({ err }, "Analysis failed");
    res.status(502).json({ error: "Analysis failed. Please try again in a moment." });
  }
});

router.get("/analyses/stats", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const user = await getOrCreateUser(clerkUserId);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalRow] = await db
    .select({ total: count() })
    .from(analysesTable)
    .where(eq(analysesTable.userId, user.id));

  const [monthRow] = await db
    .select({ thisMonth: count() })
    .from(analysesTable)
    .where(
      and(
        eq(analysesTable.userId, user.id),
        gte(analysesTable.createdAt, startOfMonth),
      ),
    );

  const [avgRow] = await db
    .select({ avgScore: avg(analysesTable.score) })
    .from(analysesTable)
    .where(eq(analysesTable.userId, user.id));

  res.json({
    total: totalRow?.total ?? 0,
    thisMonth: monthRow?.thisMonth ?? 0,
    avgScore: avgRow?.avgScore ? Math.round(Number(avgRow.avgScore)) : null,
    tier: user.tier,
  });
});

router.get("/analyses/:id", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(
      and(
        eq(analysesTable.id, params.data.id),
        eq(analysesTable.userId, user.id),
      ),
    );

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(analysis);
});

router.delete("/analyses/:id", async (req, res): Promise<void> => {
  const clerkUserId = await requireUser(req, res);
  if (!clerkUserId) return;

  const params = DeleteAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);

  const [deleted] = await db
    .delete(analysesTable)
    .where(
      and(
        eq(analysesTable.id, params.data.id),
        eq(analysesTable.userId, user.id),
      ),
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
