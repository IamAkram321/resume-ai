import express, { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@resume-ai/db";
import { stripe } from "../lib/stripe";
import { logger } from "../lib/logger";
import { randomUUID } from "crypto";

const router: IRouter = Router();
const rawBody = express.raw({ type: ["application/json", "application/octet-stream"], limit: "10mb" });

async function getOrCreateUser(clerkUserId: string) {
  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        id: randomUUID(),
        clerkId: clerkUserId,
        email: `${clerkUserId}@unknown.com`,
        tier: "free",
      })
      .returning();
  }
  return user;
}

router.post("/billing/create-checkout", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);

  const baseUrl = process.env.APP_URL ?? "http://localhost:8081";

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "upi"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      success_url: `${baseUrl}/dashboard?upgraded=true`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { userId: user.id, clerkId: clerkUserId },
    });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Stripe checkout session creation failed");
    res.status(502).json({ error: err?.message ?? "Failed to create checkout session" });
    return;
  }

  res.json({ url: session.url! });
});

router.post("/billing/portal", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);

  if (!user.stripeCustomerId) {
    res.status(400).json({ error: "No Stripe customer found. Please subscribe first." });
    return;
  }

  const baseUrl = process.env.APP_URL ?? "http://localhost:8081";

  let session;
  try {
    session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Stripe portal session creation failed");
    res.status(502).json({ error: err?.message ?? "Failed to open billing portal" });
    return;
  }

  res.json({ url: session.url });
});

// Raw body needed for Stripe webhook signature verification
router.post(
  "/billing/webhook",
  rawBody,
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig as string,
        webhookSecret,
      );
    } catch (err: any) {
      req.log.warn({ err: err.message }, "Stripe webhook signature failed");
      res.status(400).json({ error: `Webhook error: ${err.message}` });
      return;
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const clerkId = session.metadata?.clerkId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (clerkId) {
          await db
            .update(usersTable)
            .set({
              tier: "pro",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            })
            .where(eq(usersTable.clerkId, clerkId));
          req.log.info({ clerkId }, "User upgraded to pro");
        }
      } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        await db
          .update(usersTable)
          .set({ tier: "free", stripeSubscriptionId: null })
          .where(eq(usersTable.stripeCustomerId, customerId));
        req.log.info({ customerId }, "User downgraded to free");
      }
    } catch (err) {
      req.log.error({ err }, "Error processing Stripe webhook");
    }

    res.json({ status: "ok" });
  },
);

export default router;