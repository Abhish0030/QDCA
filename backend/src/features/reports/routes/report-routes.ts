import { type Router as ExpressRouter, Router } from "express";
import { requireRequestSession } from "../../../auth/session";
import { getReports } from "../services/report-service";

export const reportRouter: ExpressRouter = Router();

reportRouter.get("/", async (req, res, next) => {
	try {
		const session = await requireRequestSession(req);
		res.json(await getReports(session.user.id));
	} catch (error) {
		next(error);
	}
});
