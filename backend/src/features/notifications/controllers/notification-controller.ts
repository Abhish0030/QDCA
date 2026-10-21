import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireRequestSession } from "../../../auth/session";
import {
	dismissNotification,
	getNotifications,
	markAllNotificationsRead,
} from "../services/notification-service";

const limitSchema = z.coerce.number().int().min(1).max(50).default(20);

export async function listNotificationsHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const limit = limitSchema.parse(req.query.limit);
		return res.json({ success: true, data: await getNotifications(session.user.id, limit) });
	} catch (error) {
		return next(error);
	}
}

export async function markNotificationsReadHandler(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const session = await requireRequestSession(req);
		return res.json({
			success: true,
			data: await markAllNotificationsRead(session.user.id, 20),
		});
	} catch (error) {
		return next(error);
	}
}

export async function dismissNotificationHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		if (!notificationId) {
			return res.status(400).json({ success: false, message: "Notification id is required" });
		}
		const dismissed = await dismissNotification(session.user.id, notificationId);
		if (!dismissed)
			return res.status(404).json({ success: false, message: "Notification not found" });
		return res.status(204).send();
	} catch (error) {
		return next(error);
	}
}
