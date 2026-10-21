import { type IRouter, Router } from "express";
import { leaderboardHandler } from "../controllers/leaderboard-controller";

const router: IRouter = Router();

router.get("/", leaderboardHandler);

export { router as leaderboardRouter };
