import { randomUUID } from "node:crypto";
import { prisma } from "../../../database";

export interface CreateNotificationInput {
	userId: string;
	type: string;
	title: string;
	message: string;
	entityType?: string;
	entityId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
	return prisma.notification.create({
		data: {
			id: randomUUID(),
			...input,
			updatedAt: new Date(),
		},
	});
}

export async function getNotifications(userId: string, limit: number) {
	const where = { userId, dismissedAt: null };
	const [items, unreadCount] = await Promise.all([
		prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: limit }),
		prisma.notification.count({ where: { ...where, readAt: null } }),
	]);
	return {
		items: items.map(toClientNotification),
		unreadCount,
	};
}

export async function markAllNotificationsRead(userId: string, limit: number) {
	const now = new Date();
	await prisma.notification.updateMany({
		where: { userId, dismissedAt: null, readAt: null },
		data: { readAt: now, updatedAt: now },
	});
	return getNotifications(userId, limit);
}

export async function dismissNotification(userId: string, id: string) {
	const notification = await prisma.notification.findFirst({ where: { id, userId } });
	if (!notification) return false;
	await prisma.notification.update({
		where: { id },
		data: { dismissedAt: new Date(), updatedAt: new Date() },
	});
	return true;
}

function toClientNotification(notification: {
	id: string;
	type: string;
	title: string;
	message: string;
	entityType: string | null;
	entityId: string | null;
	readAt: Date | null;
	createdAt: Date;
}) {
	return {
		id: notification.id,
		type: notification.type,
		title: notification.title,
		message: notification.message,
		entityType: notification.entityType,
		entityId: notification.entityId,
		unread: notification.readAt === null,
		createdAt: notification.createdAt,
	};
}
