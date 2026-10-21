import assert from "node:assert/strict";
import test from "node:test";
import {
	compareRankedUsers,
	getNextStreakState,
	rankLeaderboardRowsLikeDatabase,
	rankLeaderboardUsersInMemory,
} from "./leaderboard-service";

test("increments streak only once per utc day and carries consecutive days", () => {
	const first = getNextStreakState(null, 0, new Date("2026-07-01T10:00:00.000Z"));
	assert.equal(first.currentStreak, 1);

	const sameDay = getNextStreakState(
		new Date("2026-07-01T12:00:00.000Z"),
		1,
		new Date("2026-07-01T18:00:00.000Z"),
	);
	assert.equal(sameDay.currentStreak, 1);

	const nextDay = getNextStreakState(
		new Date("2026-07-01T12:00:00.000Z"),
		1,
		new Date("2026-07-02T01:00:00.000Z"),
	);
	assert.equal(nextDay.currentStreak, 2);
});

test("resets streak after a missed day", () => {
	const state = getNextStreakState(
		new Date("2026-07-01T12:00:00.000Z"),
		5,
		new Date("2026-07-04T09:00:00.000Z"),
	);

	assert.equal(state.currentStreak, 1);
});

test("sorts leaderboard entries by streak, points, question volume, then recency", () => {
	const users = [
		{
			id: "u1",
			name: "Alpha",
			email: "alpha@example.com",
			image: null,
			currentStreak: 3,
			longestStreak: 3,
			points: 20,
			lastActivityAt: new Date("2026-07-02T10:00:00.000Z"),
			_count: { questions: 7 },
		},
		{
			id: "u2",
			name: "Beta",
			email: "beta@example.com",
			image: null,
			currentStreak: 4,
			longestStreak: 4,
			points: 10,
			lastActivityAt: new Date("2026-07-02T11:00:00.000Z"),
			_count: { questions: 2 },
		},
		{
			id: "u3",
			name: "Gamma",
			email: "gamma@example.com",
			image: null,
			currentStreak: 3,
			longestStreak: 3,
			points: 20,
			lastActivityAt: new Date("2026-07-02T09:00:00.000Z"),
			_count: { questions: 5 },
		},
	];

	const ranked = [...users].sort(compareRankedUsers);

	assert.equal(ranked[0]?.id, "u2");
	assert.equal(ranked[1]?.id, "u1");
	assert.equal(ranked[2]?.id, "u3");
});

test("database-style leaderboard ranking matches the legacy in-memory output", () => {
	const users = [
		{
			id: "u1",
			name: "Alpha Example",
			email: "alpha@example.com",
			image: null,
			currentStreak: 4,
			longestStreak: 7,
			points: 100,
			lastActivityAt: new Date("2026-07-10T12:00:00.000Z"),
			_count: { questions: 12 },
		},
		{
			id: "u2",
			name: "Beta Example",
			email: "beta@example.com",
			image: null,
			currentStreak: 4,
			longestStreak: 6,
			points: 100,
			lastActivityAt: new Date("2026-07-11T12:00:00.000Z"),
			_count: { questions: 10 },
		},
		{
			id: "u3",
			name: "Gamma Example",
			email: "gamma@example.com",
			image: null,
			currentStreak: 4,
			longestStreak: 5,
			points: 90,
			lastActivityAt: null,
			_count: { questions: 30 },
		},
		{
			id: "u4",
			name: "Delta Example",
			email: "delta@example.com",
			image: null,
			currentStreak: 1,
			longestStreak: 3,
			points: 50,
			lastActivityAt: new Date("2026-07-09T12:00:00.000Z"),
			_count: { questions: 2 },
		},
		{
			id: "u5",
			name: "Epsilon Example",
			email: "epsilon@example.com",
			image: null,
			currentStreak: 4,
			longestStreak: 6,
			points: 100,
			lastActivityAt: new Date("2026-07-11T12:00:00.000Z"),
			_count: { questions: 10 },
		},
		{
			id: "u6",
			name: "Zeta Example",
			email: "zeta@example.com",
			image: null,
			currentStreak: 0,
			longestStreak: 2,
			points: 10,
			lastActivityAt: new Date("2026-07-01T12:00:00.000Z"),
			_count: { questions: 1 },
		},
	];

	const databaseRanked = rankLeaderboardRowsLikeDatabase(users);
	const legacyRanked = rankLeaderboardUsersInMemory(users);

	assert.deepEqual(databaseRanked, legacyRanked);
	assert.deepEqual(
		databaseRanked.slice(0, 3).map((entry) => entry.userId),
		legacyRanked.slice(0, 3).map((entry) => entry.userId),
	);
	assert.equal(databaseRanked[1]?.userId, "u2");
	assert.equal(databaseRanked[2]?.userId, "u5");
	assert.equal(databaseRanked.find((entry) => entry.userId === "u6")?.rank, 6);
});
