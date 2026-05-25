import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@resume-ai/db";
import { getUsageCount } from "../lib/redis";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    const email = (auth as any)?.sessionClaims?.email as string | undefined;
    const name = (auth as any)?.sessionClaims?.name as string | undefined;
    [user] = await db
      .insert(usersTable)
      .values({
        id: randomUUID(),
        clerkId: clerkUserId,
        email: email ?? `${clerkUserId}@unknown.com`,
        name: name ?? null,
        tier: "free",
      })
      .returning();
  }

  res.json(user);
});

router.get("/users/me/usage", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));

  const isPro = user?.tier === "pro";
  const limit = isPro ? 999999 : 3;
  const used = isPro ? 0 : await getUsageCount(clerkUserId);
  const remaining = isPro ? 999999 : Math.max(0, limit - used);

  res.json({ used, limit, remaining, isPro });
});

export default router;
