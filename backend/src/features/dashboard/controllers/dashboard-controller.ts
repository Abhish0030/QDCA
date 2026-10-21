import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireAdminSession, requireRequestSession } from "../../../auth/session";
import {
	getDashboardModelStatusSnapshot,
	getDashboardOverview,
	getProcessingPerformance,
	getDashboardSummary,
	getDifficultyDistribution,
	getPipelineContribution,
	getQuestionTrend,
	setDashboardActiveModel,
} from "../services/dashboard-service";

const trendQuerySchema = z.object({
	range: z.enum(["week", "month", "year"]).default("week"),
});
const modelStatusSchema = z.object({
	model: z.enum(["llama", "gemma", "nemotron", "groq"]),
});

export async function dashboardSummaryHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		return res.json(await getDashboardSummary(session.user.id));
	} catch (error) {
		return next(error);
	}
}

export async function dashboardOverviewHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		return res.json(await getDashboardOverview(session.user.id));
	} catch (error) {
		return next(error);
	}
}

export async function dashboardModelStatusHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		return res.json(await getDashboardModelStatusSnapshot(session.user.id));
	} catch (error) {
		return next(error);
	}
}

export async function pipelineContributionHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		return res.json(await getPipelineContribution(session.user.id));
	} catch (error) {
		return next(error);
	}
}

export async function processingPerformanceHandler(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		await requireRequestSession(req);
		return res.json(await getProcessingPerformance());
	} catch (error) {
		return next(error);
	}
}

export async function updateDashboardModelStatusHandler(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		await requireAdminSession(req);
		const parsed = modelStatusSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid model selection" });
		}

		await setDashboardActiveModel(parsed.data.model);
		const session = await requireRequestSession(req);
		const overview = await getDashboardOverview(session.user.id);

		return res.json({
			success: true,
			data: overview.modelStatus,
		});
	} catch (error) {
		return next(error);
	}
}

export async function difficultyDistributionHandler(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const session = await requireRequestSession(req);
		return res.json(await getDifficultyDistribution(session.user.id));
	} catch (error) {
		return next(error);
	}
}

export async function questionTrendHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = trendQuerySchema.safeParse(req.query);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid trend range" });
		}
		return res.json(await getQuestionTrend(parsed.data.range, session.user.id));
	} catch (error) {
		return next(error);
	}
}
