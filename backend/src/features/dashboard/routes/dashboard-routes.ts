import { type IRouter, Router } from "express";
import {
	dashboardModelStatusHandler,
	dashboardOverviewHandler,
	dashboardSummaryHandler,
	difficultyDistributionHandler,
	pipelineContributionHandler,
	processingPerformanceHandler,
	questionTrendHandler,
	updateDashboardModelStatusHandler,
} from "../controllers/dashboard-controller";

const router: IRouter = Router();

router.get("/summary", dashboardSummaryHandler);
router.get("/overview", dashboardOverviewHandler);
router.get("/model-status", dashboardModelStatusHandler);
router.patch("/model-status", updateDashboardModelStatusHandler);
router.get("/difficulty-distribution", difficultyDistributionHandler);
router.get("/question-trend", questionTrendHandler);
router.get("/pipeline-contribution", pipelineContributionHandler);
router.get("/performance", processingPerformanceHandler);

export { router as dashboardRouter };
