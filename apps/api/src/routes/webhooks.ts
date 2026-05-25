import express, { Router, type IRouter, type Request, type Response } from "express";
import { Webhook } from "svix";
import { db, usersTable } from "@resume-ai/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();
const rawBody = express.raw({ type: ["application/json", "application/octet-stream"], limit: "10mb" });

// Clerk webhook — user.created / user.updated events
router.post("/clerk/webhook", rawBody, async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    req.log.error("CLERK_WEBHOOK_SECRET not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing svix headers" });
    return;
  }

  let payload: any;
  try {
    const wh = new Webhook(webhookSecret);
    payload = wh.verify(req.body as Buffer, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    req.log.warn({ err }, "Clerk webhook verification failed");
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  const { type, data } = payload as { type: string; data: any };

  if (type === "user.created") {
    const clerkId = data.id as string;
    const email = (data.email_addresses?.[0]?.email_address as string) ?? `${clerkId}@unknown.com`;
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId));

    if (!existing) {
      await db.insert(usersTable).values({
        id: randomUUID(),
        clerkId,
        email,
        name,
        tier: "free",
      });
      req.log.info({ clerkId, email }, "Created user from Clerk webhook");
    }
  }

  if (type === "user.updated") {
    const clerkId = data.id as string;
    const email = (data.email_addresses?.[0]?.email_address as string) ?? undefined;
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

    if (email) {
      await db
        .update(usersTable)
        .set({ email, name })
        .where(eq(usersTable.clerkId, clerkId));
    }
  }

  res.json({ status: "ok" });
});

export default router;
