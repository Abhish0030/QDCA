import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireRequestSession } from "../../../auth/session";
import { getActivityFeed } from "../services/activity-service";

const activityQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function listActivityHandler(req: Request, res: Response, next: NextFunction) {
	try {
		await requireRequestSession(req);
		const parsed = activityQuerySchema.safeParse(req.query);

		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid activity limit" });
		}

		return res.json({
			success: true,
			data: await getActivityFeed(parsed.data.limit),
		});
	} catch (error) {
		return next(error);
	}
}
