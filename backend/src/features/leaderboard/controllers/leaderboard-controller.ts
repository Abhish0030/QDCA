import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireRequestSession } from "../../../auth/session";
import { getLeaderboard } from "../services/leaderboard-service";

const leaderboardQuerySchema = z.object({
	period: z.enum(["daily"]).default("daily"),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function leaderboardHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = leaderboardQuerySchema.safeParse(req.query);

		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid leaderboard query" });
		}

		return res.json({
			success: true,
			data: await getLeaderboard(parsed.data.limit, session.user.id),
		});
	} catch (error) {
		return next(error);
	}
}
