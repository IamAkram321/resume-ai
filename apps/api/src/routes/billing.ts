import express, { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@resume-ai/db";
import { stripe } from "../lib/stripe";
import { getOrCreateUser } from "../lib/users";

const router: IRouter = Router();
const rawBody = express.raw({ type: ["application/json", "application/octet-stream"], limit: "10mb" });

router.post("/billing/create-checkout", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);
  const baseUrl = process.env.APP_URL ?? "http://localhost:8081";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "upi"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      success_url: `${baseUrl}/dashboard?upgraded=true`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: { userId: user.id, clerkId: clerkUserId },
    });
    res.json({ url: session.url! });
  } catch (err: unknown) {
    req.log.error({ err }, "Stripe checkout session creation failed");
    res.status(502).json({ error: "Failed to create checkout session" });
  }
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

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    });
    res.json({ url: session.url });
  } catch (err: unknown) {
    req.log.error({ err }, "Stripe portal session creation failed");
    res.status(502).json({ error: "Failed to open billing portal" });
  }
});

export const stripeWebhookRouter: IRouter = Router();

stripeWebhookRouter.post(
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid signature";
      req.log.warn({ err: message }, "Stripe webhook signature failed");
      res.status(400).json({ error: `Webhook error: ${message}` });
      return;
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as {
          payment_status?: string;
          metadata?: { clerkId?: string };
          customer?: string;
          subscription?: string;
        };

        if (session.payment_status && session.payment_status !== "paid") {
          res.json({ status: "ignored" });
          return;
        }

        const clerkId = session.metadata?.clerkId;
        if (clerkId) {
          const [existing] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.clerkId, clerkId));

          if (existing?.tier === "pro") {
            res.json({ status: "ok" });
            return;
          }

          await db
            .update(usersTable)
            .set({
              tier: "pro",
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            })
            .where(eq(usersTable.clerkId, clerkId));
          req.log.info({ clerkId }, "User upgraded to pro");
        }
      } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as { customer?: string };
        const customerId = subscription.customer;

        await db
          .update(usersTable)
          .set({ tier: "free", stripeSubscriptionId: null })
          .where(eq(usersTable.stripeCustomerId, customerId as string));
        req.log.info({ customerId }, "User downgraded to free");
      }
    } catch (err) {
      req.log.error({ err }, "Error processing Stripe webhook");
      res.status(500).json({ error: "Webhook processing failed" });
      return;
    }

    res.json({ status: "ok" });
  },
);

export default router;
