import { Router, type IRouter } from "express";
import billingWebhookRouter from "./billing";
import clerkWebhookRouter from "./webhooks";

// These routes receive raw bodies for signature verification.
// They are mounted before express.json() in app.ts.
// Only the specific webhook paths are included here.
const router: IRouter = Router();

router.use(clerkWebhookRouter);
router.use(billingWebhookRouter);

export default router;
