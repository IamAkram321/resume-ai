import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@resume-ai/db";
import { getUsageSummary } from "../lib/feature-usage";
import { getOrCreateUser } from "../lib/users";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);
  res.json(user);
});

router.get("/users/me/usage", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);
  const summary = await getUsageSummary(user.id, user.tier === "pro");
  res.json(summary);
});

export default router;
