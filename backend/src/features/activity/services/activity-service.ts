import type { Prisma } from "@prisma/client";
import { prisma } from "../../../database";
import { updateUserContribution } from "../../leaderboard/services/leaderboard-service";

interface ActivityRecord {
	id: string;
	actionType: string;
	description: string;
	timestamp: string;
	questionsClassified: number;
	user: {
		id: string;
		name: string;
		avatar: string | null;
		initials: string;
	};
}

interface RecordActivityInput {
	userId: string;
	actionType: string;
	description: string;
	points: number;
	metadata?: Prisma.InputJsonValue;
}

export async function recordActivity(input: RecordActivityInput) {
	return prisma.$transaction(async (transaction) => {
		await updateUserContribution(transaction, {
			userId: input.userId,
			points: input.points,
		});

		return transaction.activityLog.create({
			data: {
				userId: input.userId,
				actionType: input.actionType,
				description: input.description,
				metadata: input.metadata,
			},
		});
	});
}

export async function getActivityFeed(limit: number) {
	const [userActivitiesResult, adminActivitiesResult] = await Promise.allSettled([
		prisma.activityLog.findMany({
			orderBy: { createdAt: "desc" },
			take: limit,
			include: {
				user: {
					select: { id: true, name: true, email: true, image: true },
				},
			},
		}),
		prisma.adminAuditLog.findMany({
			orderBy: { createdAt: "desc" },
			take: limit,
			include: {
				actor: {
					select: { id: true, name: true, email: true, image: true },
				},
			},
		}),
	]);

	const userActivities =
		userActivitiesResult.status === "fulfilled" ? userActivitiesResult.value : [];
	const adminActivities =
		adminActivitiesResult.status === "fulfilled" ? adminActivitiesResult.value : [];

	if (userActivitiesResult.status === "rejected") {
		console.warn("[activity] user activity query failed", {
			message:
				userActivitiesResult.reason instanceof Error
					? userActivitiesResult.reason.message
					: String(userActivitiesResult.reason),
		});
	}

	if (adminActivitiesResult.status === "rejected") {
		console.warn("[activity] admin activity query failed", {
			message:
				adminActivitiesResult.reason instanceof Error
					? adminActivitiesResult.reason.message
					: String(adminActivitiesResult.reason),
		});
	}

	return [...userActivities.map(mapUserActivity), ...adminActivities.map(mapAdminActivity)]
		.sort(
			(left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp),
		)
		.slice(0, limit);
}

function mapUserActivity(activity: {
	id: string;
	actionType: string;
	description: string;
	createdAt: Date;
	metadata: Prisma.JsonValue | null;
	user: { id: string; name: string; email: string; image: string | null };
}): ActivityRecord {
	return {
		id: activity.id,
		actionType: activity.actionType,
		description: activity.description,
		timestamp: activity.createdAt.toISOString(),
		questionsClassified: readQuestionsClassified(
			activity.actionType,
			activity.metadata,
			activity.description,
		),
		user: {
			id: activity.user.id,
			name: activity.user.name,
			avatar: activity.user.image,
			initials: buildInitials(activity.user.name, activity.user.email),
		},
	};
}

function mapAdminActivity(activity: {
	id: string;
	action: string;
	target: string | null;
	createdAt: Date;
	actor: { id: string; name: string; email: string; image: string | null };
}): ActivityRecord {
	return {
		id: `admin-${activity.id}`,
		actionType: "admin_action",
		description: activity.target ? `${activity.action} · ${activity.target}` : activity.action,
		timestamp: activity.createdAt.toISOString(),
		questionsClassified: 0,
		user: {
			id: activity.actor.id,
			name: activity.actor.name,
			avatar: activity.actor.image,
			initials: buildInitials(activity.actor.name, activity.actor.email),
		},
	};
}

function buildInitials(name: string, email: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

	if (parts.length > 0) {
		return parts.map((part) => part.charAt(0).toUpperCase()).join("");
	}

	return email.charAt(0).toUpperCase() || "U";
}

function readQuestionsClassified(
	actionType: string,
	metadata: Prisma.JsonValue | null,
	description: string,
) {
	if (actionType === "question_classified") {
		return 1;
	}

	if (actionType === "pdf_questions_classified" || actionType === "pdf_uploaded") {
		const metadataValue =
			isRecord(metadata) && typeof metadata.classifiedQuestions === "number"
				? metadata.classifiedQuestions
				: isRecord(metadata) && typeof metadata.questionsClassified === "number"
					? metadata.questionsClassified
				: isRecord(metadata) && typeof metadata.totalQuestions === "number"
					? metadata.totalQuestions
					: null;
		if (metadataValue !== null) {
			return metadataValue;
		}

		const matched = description.match(/(\d+)/);
		return matched ? Number(matched[1]) : 0;
	}

	return 0;
}

function isRecord(value: Prisma.JsonValue | null): value is Record<string, Prisma.JsonValue> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
