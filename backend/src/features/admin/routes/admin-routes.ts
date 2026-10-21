import { type Router as ExpressRouter, Router } from "express";
import { z } from "zod";
import { requireAdminSession } from "../../../auth/session";
import { AppError } from "../../../shared/utils/app-error";
import {
	deleteAdminUser,
	getAdminActivity,
	getAdminAnalytics,
	getAdminDifficulty,
	getAdminQuestions,
	getAdminSettings,
	getAdminStats,
	getAdminUploads,
	getAdminUser,
	getAdminUsers,
	getRecentActions,
	getRecentSignups,
	overrideQuestion,
	updateAdminSettings,
	updateAdminUser,
	verifyAdminUpload,
} from "../services/admin-service";

export const adminRouter: ExpressRouter = Router();

const pageSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

adminRouter.use(async (req, _res, next) => {
	try {
		await requireAdminSession(req);
		next();
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/access", async (_req, res) => {
	res.json({ allowed: true });
});

adminRouter.get("/stats", async (_req, res, next) => {
	try {
		res.json(await getAdminStats());
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/activity", async (req, res, next) => {
	try {
		const range = z.enum(["week", "month", "year"]).catch("week").parse(req.query.range);
		res.json(await getAdminActivity(range));
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/difficulty-distribution", async (_req, res, next) => {
	try {
		res.json(await getAdminDifficulty());
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/recent-signups", async (_req, res, next) => {
	try {
		res.json(await getRecentSignups());
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/recent-actions", async (_req, res, next) => {
	try {
		res.json(await getRecentActions());
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/users", async (req, res, next) => {
	try {
		const paging = pageSchema.parse(req.query);
		res.json(
			await getAdminUsers({
				...paging,
				search: typeof req.query.search === "string" ? req.query.search : undefined,
				role: typeof req.query.role === "string" ? req.query.role : undefined,
				status: typeof req.query.status === "string" ? req.query.status : undefined,
			}),
		);
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/users/:id", async (req, res, next) => {
	try {
		const result = await getAdminUser(req.params.id ?? "");
		if (!result) throw new AppError("User not found", 404);
		res.json(result);
	} catch (error) {
		next(error);
	}
});

adminRouter.patch("/users/:id/role", async (req, res, next) => {
	try {
		const admin = await requireAdminSession(req);
		const role = z.enum(["admin", "user"]).parse(req.body.role);
		res.json({
			success: true,
			user: await updateAdminUser(admin.user.id, req.params.id ?? "", { role }),
		});
	} catch (error) {
		next(error);
	}
});

adminRouter.patch("/users/:id/status", async (req, res, next) => {
	try {
		const admin = await requireAdminSession(req);
		const status = z.enum(["active", "suspended"]).parse(req.body.status);
		res.json({
			success: true,
			user: await updateAdminUser(admin.user.id, req.params.id ?? "", { status }),
		});
	} catch (error) {
		next(error);
	}
});

adminRouter.delete("/users/:id", async (req, res, next) => {
	try {
		const admin = await requireAdminSession(req);
		const id = req.params.id ?? "";
		if (id === admin.user.id) throw new AppError("You cannot delete your own account", 400);
		await deleteAdminUser(admin.user.id, id);
		res.json({ success: true });
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/questions", async (req, res, next) => {
	try {
		const paging = pageSchema.parse(req.query);
		res.json(
			await getAdminQuestions({
				...paging,
				filter: typeof req.query.filter === "string" ? req.query.filter : undefined,
			}),
		);
	} catch (error) {
		next(error);
	}
});

adminRouter.patch("/questions/:id/override", async (req, res, next) => {
	try {
		const admin = await requireAdminSession(req);
		const difficulty = z
			.enum(["Very Easy", "Easy", "Medium", "Hard", "Expert"])
			.parse(req.body.difficulty);
		res.json({
			success: true,
			question: await overrideQuestion(admin.user.id, req.params.id ?? "", difficulty),
		});
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/uploads", async (req, res, next) => {
	try {
		const paging = pageSchema.parse(req.query);
		res.json(await getAdminUploads(paging.page, paging.limit));
	} catch (error) {
		next(error);
	}
});

adminRouter.post("/uploads/:id/retry", async (req, res, next) => {
	try {
		res.json(await verifyAdminUpload(req.params.id ?? ""));
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/analytics", async (_req, res, next) => {
	try {
		res.json(await getAdminAnalytics());
	} catch (error) {
		next(error);
	}
});

adminRouter.get("/settings", async (_req, res, next) => {
	try {
		res.json(await getAdminSettings());
	} catch (error) {
		next(error);
	}
});

adminRouter.patch("/settings", async (req, res, next) => {
	try {
		const admin = await requireAdminSession(req);
		const settings = z
			.object({
				aiModel: z.string().min(1).optional(),
				confidenceThreshold: z.number().min(0).max(1).optional(),
				maintenanceMode: z.boolean().optional(),
				signupsEnabled: z.boolean().optional(),
			})
			.parse(req.body);
		res.json({ success: true, settings: await updateAdminSettings(admin.user.id, settings) });
	} catch (error) {
		next(error);
	}
});
