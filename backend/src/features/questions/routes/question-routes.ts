import { type IRouter, Router } from "express";
import { createRateLimiter } from "../../../middleware/rate-limit";
import {
	listQuestionsHandler,
	similarQuestionsHandler,
	studyRoadmapHandler,
	subjectDetectionHandler,
} from "../controllers/question-controller";

const router: IRouter = Router();
const subjectDetectionRateLimiter = createRateLimiter({
	keyPrefix: "subject-detection",
	windowMs: 60_000,
	max: 30,
	message: "Too many subject detection requests. Please wait a minute and try again.",
});

router.post("/similar", similarQuestionsHandler);
router.post("/subject-detection", subjectDetectionRateLimiter, subjectDetectionHandler);
router.get("/study-roadmap", studyRoadmapHandler);
router.get("/", listQuestionsHandler);

export { router as questionRouter };
