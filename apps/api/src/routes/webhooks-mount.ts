import { Router, type IRouter } from "express";
import clerkWebhookRouter from "./webhooks";
import { stripeWebhookRouter } from "./billing";

const router: IRouter = Router();

router.use(clerkWebhookRouter);
router.use(stripeWebhookRouter);

export default router;
