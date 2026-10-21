import { prisma } from "../../../database";

export interface LeaderboardEntry {
	rank: number;
	userId: string;
	name: string;
	avatar: string | null;
	initials: string;
	currentStreak: number;
	longestStreak: number;
	points: number;
	questionsClassified: number;
	lastActivity: string | null;
}

interface LeaderboardResponse {
	items: LeaderboardEntry[];
	currentUser: LeaderboardEntry | null;
	updatedAt: string;
}

interface UpdateUserContributionInput {
	userId: string;
	points: number;
	occurredAt?: Date;
}

interface RankedUser {
	id: string;
	name: string;
	email: string;
	image: string | null;
	currentStreak: number;
	longestStreak: number;
	points: number;
	lastActivityAt: Date | null;
	_count: {
		questions: number;
	};
}

interface RankedLeaderboardRow {
	id: string;
	name: string;
	email: string;
	image: string | null;
	currentStreak: number;
	longestStreak: number;
	points: number;
	lastActivityAt: Date | null;
	questionsClassified: number;
	rank: number;
}

type DatabaseRankComparableUser = Omit<RankedLeaderboardRow, "rank">;

export async function getLeaderboard(
	limit: number,
	currentUserId: string,
): Promise<LeaderboardResponse> {
	const [topUsers, currentUser] = await Promise.all([
		prisma.user.findMany({
			where: { status: "active" },
			orderBy: [
				{ currentStreak: "desc" },
				{ points: "desc" },
				{ questions: { _count: "desc" } },
				{ lastActivityAt: "desc" },
				{ name: "asc" },
			],
			take: limit,
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				currentStreak: true,
				longestStreak: true,
				points: true,
				lastActivityAt: true,
				_count: {
					select: {
						questions: true,
					},
				},
			},
		}),
		findRankedUserById(currentUserId),
	]);

	const items = topUsers.map((user, index) => toLeaderboardEntry(user, index + 1));

	return {
		items,
		currentUser,
		updatedAt: new Date().toISOString(),
	};
}

async function findRankedUserById(userId: string) {
	const rows = await prisma.$queryRaw<RankedLeaderboardRow[]>`
		WITH question_counts AS (
			SELECT
				"createdById" AS "userId",
				COUNT(*)::int AS "questionsClassified"
			FROM "questions"
			WHERE "createdById" IS NOT NULL
			GROUP BY "createdById"
		),
		ranked_users AS (
			SELECT
				u."id",
				u."name",
				u."email",
				u."image",
				u."currentStreak",
				u."longestStreak",
				u."points",
				u."lastActivityAt",
				COALESCE(q."questionsClassified", 0)::int AS "questionsClassified",
				ROW_NUMBER() OVER (
					ORDER BY
						u."currentStreak" DESC,
						u."points" DESC,
						COALESCE(q."questionsClassified", 0) DESC,
						u."lastActivityAt" DESC NULLS LAST,
						u."name" ASC
				)::int AS "rank"
			FROM "users" u
			LEFT JOIN question_counts q ON q."userId" = u."id"
			WHERE u."status" = 'active'
		)
		SELECT
			"id",
			"name",
			"email",
			"image",
			"currentStreak",
			"longestStreak",
			"points",
			"lastActivityAt",
			"questionsClassified",
			"rank"
		FROM ranked_users
		WHERE "id" = ${userId}
		LIMIT 1
	`;

	const [row] = rows;
	return row ? toLeaderboardEntryFromRankedRow(row) : null;
}

export function rankLeaderboardUsersInMemory(users: RankedUser[]) {
	return [...users]
		.sort(compareRankedUsers)
		.map((user, index) => toLeaderboardEntry(user, index + 1));
}

export function toLeaderboardEntryFromRankedRow(user: RankedLeaderboardRow): LeaderboardEntry {
	return {
		rank: user.rank,
		userId: user.id,
		name: user.name,
		avatar: user.image,
		initials: buildInitials(user.name, user.email),
		currentStreak: user.currentStreak,
		longestStreak: user.longestStreak,
		points: user.points,
		questionsClassified: user.questionsClassified,
		lastActivity: user.lastActivityAt?.toISOString() ?? null,
	};
}

export function rankLeaderboardRowsLikeDatabase(users: RankedUser[]) {
	return [...users]
		.map((user) => ({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
			currentStreak: user.currentStreak,
			longestStreak: user.longestStreak,
			points: user.points,
			lastActivityAt: user.lastActivityAt,
			questionsClassified: user._count.questions,
		}))
		.sort(compareRankedLeaderboardRows)
		.map((user, index) =>
			toLeaderboardEntryFromRankedRow({
				...user,
				rank: index + 1,
			}),
		);
}

function compareRankedLeaderboardRows(
	left: DatabaseRankComparableUser,
	right: DatabaseRankComparableUser,
) {
	return (
		right.currentStreak - left.currentStreak ||
		right.points - left.points ||
		right.questionsClassified - left.questionsClassified ||
		Date.parse(right.lastActivityAt?.toISOString() ?? "1970-01-01T00:00:00.000Z") -
			Date.parse(left.lastActivityAt?.toISOString() ?? "1970-01-01T00:00:00.000Z") ||
		left.name.localeCompare(right.name)
	);
}

export async function updateUserContribution(
	db: { user: typeof prisma.user },
	input: UpdateUserContributionInput,
) {
	const occurredAt = input.occurredAt ?? new Date();
	const user = await db.user.findUniqueOrThrow({
		where: { id: input.userId },
		select: {
			currentStreak: true,
			longestStreak: true,
			points: true,
			lastStreakAt: true,
		},
	});

	const streak = getNextStreakState(user.lastStreakAt, user.currentStreak, occurredAt);

	return db.user.update({
		where: { id: input.userId },
		data: {
			points: user.points + input.points,
			currentStreak: streak.currentStreak,
			longestStreak: Math.max(user.longestStreak, streak.currentStreak),
			lastActivityAt: occurredAt,
			lastStreakAt: streak.lastStreakAt,
		},
	});
}

export function getNextStreakState(
	lastStreakAt: Date | null,
	currentStreak: number,
	occurredAt: Date,
) {
	if (!lastStreakAt) {
		return { currentStreak: 1, lastStreakAt: occurredAt };
	}

	const dayDifference = getUtcDayDifference(lastStreakAt, occurredAt);

	if (dayDifference <= 0) {
		return { currentStreak, lastStreakAt };
	}

	if (dayDifference === 1) {
		return { currentStreak: currentStreak + 1, lastStreakAt: occurredAt };
	}

	return { currentStreak: 1, lastStreakAt: occurredAt };
}

export function compareRankedUsers(left: RankedUser, right: RankedUser) {
	return (
		right.currentStreak - left.currentStreak ||
		right.points - left.points ||
		right._count.questions - left._count.questions ||
		Date.parse(right.lastActivityAt?.toISOString() ?? "1970-01-01T00:00:00.000Z") -
			Date.parse(left.lastActivityAt?.toISOString() ?? "1970-01-01T00:00:00.000Z") ||
		left.name.localeCompare(right.name)
	);
}

function toLeaderboardEntry(user: RankedUser, rank: number): LeaderboardEntry {
	return {
		rank,
		userId: user.id,
		name: user.name,
		avatar: user.image,
		initials: buildInitials(user.name, user.email),
		currentStreak: user.currentStreak,
		longestStreak: user.longestStreak,
		points: user.points,
		questionsClassified: user._count.questions,
		lastActivity: user.lastActivityAt?.toISOString() ?? null,
	};
}

function buildInitials(name: string, email: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
	if (parts.length > 0) {
		return parts.map((part) => part.charAt(0).toUpperCase()).join("");
	}
	return email.charAt(0).toUpperCase() || "U";
}

function getUtcDayDifference(previous: Date, next: Date) {
	const previousDay = Date.UTC(
		previous.getUTCFullYear(),
		previous.getUTCMonth(),
		previous.getUTCDate(),
	);
	const nextDay = Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate());
	return Math.floor((nextDay - previousDay) / 86_400_000);
}
