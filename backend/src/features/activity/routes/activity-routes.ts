import { type IRouter, Router } from "express";
import { listActivityHandler } from "../controllers/activity-controller";

const router: IRouter = Router();

router.get("/", listActivityHandler);

export { router as activityRouter };
