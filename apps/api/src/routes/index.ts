import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import analysesRouter from "./analyses";
import billingRouter from "./billing";
import generateRouter from "./generate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(analysesRouter);
router.use(billingRouter);
router.use(generateRouter);

export default router;
