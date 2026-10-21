import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireRequestSession } from "../../../auth/session";
import { getQuestions } from "../../dashboard/services/dashboard-service";
import { buildStudyRoadmap, findSimilarQuestions } from "../services/question-insights-service";
import { detectQuestionSubject } from "../services/subject-detection-service";

const questionListQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(50),
});

const similarQuestionSchema = z.object({
	questionText: z.string().trim().min(3).max(5_000),
});

const subjectDetectionRequestSchema = z.object({
	questionText: z.string().trim().min(3).max(5_000),
});

export async function listQuestionsHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = questionListQuerySchema.safeParse(req.query);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid question limit" });
		}
		return res.json(await getQuestions(session.user.id, parsed.data.limit));
	} catch (error) {
		return next(error);
	}
}

export async function similarQuestionsHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = similarQuestionSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "A question is required" });
		}
		return res.json({
			success: true,
			data: await findSimilarQuestions(session.user.id, parsed.data.questionText),
		});
	} catch (error) {
		return next(error);
	}
}

export async function studyRoadmapHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		return res.json({ success: true, data: await buildStudyRoadmap(session.user.id) });
	} catch (error) {
		return next(error);
	}
}

export async function subjectDetectionHandler(req: Request, res: Response, next: NextFunction) {
	try {
		await requireRequestSession(req);
		const parsed = subjectDetectionRequestSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "A question is required" });
		}
		return res.json(await detectQuestionSubject(parsed.data.questionText));
	} catch (error) {
		return next(error);
	}
}
