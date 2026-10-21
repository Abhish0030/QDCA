import { type IRouter, Router } from "express";
import { classifyQuestionHandler } from "../controllers/classification-controller";
import {
	changeDifficultyHandler,
	generateAnswerHandler,
	streamAnswerHandler,
} from "../controllers/question-ai-actions-controller";

const router: IRouter = Router();

router.post("/", classifyQuestionHandler);
router.post("/answer", generateAnswerHandler);
router.post("/answer/stream", streamAnswerHandler);
router.post("/change-difficulty", changeDifficultyHandler);

export { router as classificationRouter };
