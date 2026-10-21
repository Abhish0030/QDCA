import assert from "node:assert/strict";
import test from "node:test";
import {
	calculatePercentile,
	calculateDailyGoalTarget,
	createTrendBuckets,
	fillTrendBuckets,
	fillTrendBucketsFromCounts,
	normalizeContributionScores,
	summarizeProcessingPerformance,
} from "./dashboard-service";

const now = new Date("2026-06-30T12:00:00.000Z");

test("creates complete trend ranges", () => {
	assert.equal(createTrendBuckets("week", now).length, 7);
	assert.equal(createTrendBuckets("month", now).length, 30);
	assert.equal(createTrendBuckets("year", now).length, 12);
});

test("fills missing days with zero and counts matching questions", () => {
	const buckets = createTrendBuckets("week", now);
	const result = fillTrendBuckets(buckets, [
		{ createdAt: new Date("2026-06-30T08:00:00.000Z") },
		{ createdAt: new Date("2026-06-30T11:59:59.000Z") },
		{ createdAt: new Date("2026-06-28T10:00:00.000Z") },
	]);

	assert.deepEqual(
		result.map((item) => item.value),
		[0, 0, 0, 0, 1, 0, 2],
	);
});

test("database-style trend aggregation preserves the legacy bucket output", () => {
	const questions = [
		{ createdAt: new Date("2026-05-31T23:59:59.000Z") },
		{ createdAt: new Date("2026-06-01T00:00:00.000Z") },
		{ createdAt: new Date("2026-06-01T02:00:00.000Z") },
		{ createdAt: new Date("2026-06-15T12:00:00.000Z") },
		{ createdAt: new Date("2026-06-30T08:00:00.000Z") },
		{ createdAt: new Date("2026-06-30T11:59:59.000Z") },
		{ createdAt: new Date("2026-07-01T00:00:00.000Z") },
	];
	const buckets = createTrendBuckets("month", now);
	const legacy = fillTrendBuckets(buckets, questions);
	const sqlStyleCounts = new Map<string, number>();

	for (const question of questions) {
		const key = question.createdAt.toISOString().slice(0, 10);
		sqlStyleCounts.set(key, (sqlStyleCounts.get(key) ?? 0) + 1);
	}

	assert.deepEqual(fillTrendBucketsFromCounts(buckets, sqlStyleCounts), legacy);
});

test("sql-style overview aggregates preserve the legacy rolling week counts", () => {
	const todayStart = new Date("2026-06-30T00:00:00.000Z");
	const questions = [
		{ createdAt: new Date("2026-06-24T00:00:00.000Z"), confidence: 70 },
		{ createdAt: new Date("2026-06-30T08:00:00.000Z"), confidence: 90 },
		{ createdAt: new Date("2026-06-29T08:00:00.000Z"), confidence: 95 },
		{ createdAt: new Date("2026-06-27T08:00:00.000Z"), confidence: 82 },
		{ createdAt: new Date("2026-06-23T23:59:59.000Z"), confidence: 77 },
		{ createdAt: new Date("2026-06-20T08:00:00.000Z"), confidence: 88 },
		{ createdAt: new Date("2026-06-15T08:00:00.000Z"), confidence: 91 },
		{ createdAt: new Date("2026-06-08T08:00:00.000Z"), confidence: 73 },
		{ createdAt: new Date("2026-07-01T00:00:00.000Z"), confidence: 99 },
	];
	const legacyWeeklyCounts = [0, 1, 2, 3].map((index) => {
		const end = new Date(todayStart);
		end.setUTCDate(end.getUTCDate() - index * 7 + 1);
		const start = new Date(end);
		start.setUTCDate(end.getUTCDate() - 7);
		return questions.filter((question) => question.createdAt >= start && question.createdAt < end)
			.length;
	});
	const sqlStyleWeeklyCounts = [
		questions.filter(
			(question) =>
				question.createdAt >= new Date("2026-06-24T00:00:00.000Z") &&
				question.createdAt < new Date("2026-07-01T00:00:00.000Z"),
		).length,
		questions.filter(
			(question) =>
				question.createdAt >= new Date("2026-06-17T00:00:00.000Z") &&
				question.createdAt < new Date("2026-06-24T00:00:00.000Z"),
		).length,
		questions.filter(
			(question) =>
				question.createdAt >= new Date("2026-06-10T00:00:00.000Z") &&
				question.createdAt < new Date("2026-06-17T00:00:00.000Z"),
		).length,
		questions.filter(
			(question) =>
				question.createdAt >= new Date("2026-06-03T00:00:00.000Z") &&
				question.createdAt < new Date("2026-06-10T00:00:00.000Z"),
		).length,
	];

	assert.deepEqual(sqlStyleWeeklyCounts, legacyWeeklyCounts);
	assert.equal(
		Math.round(
			questions.reduce((sum, question) => sum + question.confidence, 0) / questions.length,
		),
		85,
	);
});

test("normalizes pipeline contribution scores to exactly one hundred percent", () => {
	const result = normalizeContributionScores([
		{
			id: "model",
			label: "Model",
			description: "Primary inference",
			raw: 0.62,
			accent: "from-purple-500 to-fuchsia-500",
			metricLabel: "Confidence",
			metricValue: "91%",
		},
		{
			id: "rag",
			label: "RAG",
			description: "Grounding",
			raw: 0.21,
			accent: "from-sky-500 to-cyan-500",
			metricLabel: "Chunks",
			metricValue: "120",
		},
		{
			id: "fallback",
			label: "Fallback",
			description: "Resilience",
			raw: 0.17,
			accent: "from-emerald-500 to-teal-500",
			metricLabel: "Models",
			metricValue: "3",
		},
	]);

	assert.equal(
		result.reduce((sum, item) => sum + item.percentage, 0),
		100,
	);
});

test("derives a daily goal target from the weekly goal", () => {
	assert.equal(calculateDailyGoalTarget(25), 5);
	assert.equal(calculateDailyGoalTarget(56), 10);
	assert.equal(calculateDailyGoalTarget(100), 15);
});

test("calculates percentiles from sorted duration values", () => {
	assert.equal(calculatePercentile([120, 180, 240, 600], 0.95), 600);
	assert.equal(calculatePercentile([120, 180, 240, 600], 0.5), 180);
	assert.equal(calculatePercentile([], 0.95), 0);
});

test("summarizes recent classification and answer timing telemetry", () => {
	const summary = summarizeProcessingPerformance(
		[
			{
				name: "classification_request",
				step: "total",
				durationMs: 420,
				recordedAt: Date.now(),
				context: { provider: "ollama", actualModel: "gemma3:1b" },
			},
			{
				name: "classification_request",
				step: "rag_retrieval",
				durationMs: 45,
				recordedAt: Date.now(),
				context: {},
			},
			{
				name: "classification_request",
				step: "llm_call",
				durationMs: 260,
				recordedAt: Date.now(),
				context: { provider: "ollama", model: "gemma3:1b" },
			},
			{
				name: "answer_stream_request",
				step: "total",
				durationMs: 980,
				recordedAt: Date.now(),
				context: { provider: "ollama", actualModel: "gemma3:1b" },
			},
			{
				name: "answer_stream_request",
				step: "rag_retrieval",
				durationMs: 55,
				recordedAt: Date.now(),
				context: {},
			},
			{
				name: "answer_stream_request",
				step: "answer_review",
				durationMs: 120,
				recordedAt: Date.now(),
				context: { provider: "ollama", model: "gemma3:1b" },
			},
			{
				name: "answer_stream_request",
				step: "llm_call",
				durationMs: 610,
				recordedAt: Date.now(),
				context: { provider: "ollama", model: "gemma3:1b" },
			},
		],
		30 * 60 * 1_000,
	);

	assert.equal(summary.hasTelemetry, true);
	assert.equal(summary.classification.total.averageMs, 420);
	assert.equal(summary.classification.stages[0].step, "rag_retrieval");
	assert.equal(summary.classification.llmCalls[0].model, "gemma3:1b");
	assert.equal(summary.answer.total.averageMs, 980);
	assert.equal(summary.answer.stages[1].step, "answer_review");
	assert.equal(summary.answer.llmCalls[0].provider, "ollama");
});
