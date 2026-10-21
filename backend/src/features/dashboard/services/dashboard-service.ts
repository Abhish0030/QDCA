import { env } from "../../../config/env";
import { prisma } from "../../../database";
import { getRecentPerfSamples, type PerfMetricSample } from "../../../shared/utils/perf-tracker";
import {
	getGroqModel,
	isGroqConfigured,
} from "../../questions/services/groq-client";
import { isGroqHealthyCached } from "../../questions/services/groq-health";
import {
	getOpenRouterConfiguredModelLabel,
	getOpenRouterGemmaModel,
	getOpenRouterNemotronModel,
	isOpenRouterGemmaConfigured,
	isOpenRouterNemotronConfigured,
} from "../../questions/services/openrouter-client";
import { buildOllamaHeaders } from "../../questions/services/ollama-client";
import {
	isOpenRouterGemmaHealthyCached,
	isOpenRouterHealthyCached,
} from "../../questions/services/openrouter-health";

export type TrendRange = "week" | "month" | "year";

const DIFFICULTY_KEYS = ["very_easy", "easy", "medium", "hard", "expert"] as const;
const MODEL_OPTIONS = [
	{
		key: "llama",
		label: "Llama 3.2",
		model: env.OLLAMA_LLAMA_MODEL?.trim() || "llama3.2",
		provider: "ollama",
	},
	{
		key: "gemma",
		label: "Gemma 4 26B (OpenRouter Free)",
		model: getOpenRouterGemmaModel(),
		provider: "openrouter",
	},
	{
		key: "nemotron",
		label: getOpenRouterConfiguredModelLabel(),
		model: getOpenRouterNemotronModel(),
		provider: "openrouter",
	},
	{
		key: "groq",
		label: "Groq GPT OSS 120B",
		model: getGroqModel(),
		provider: "groq",
	},
] as const;
const OLLAMA_STATUS_CACHE_TTL_MS = 15_000;
const OLLAMA_TAGS_CACHE_TTL_MS = 30_000;
const DASHBOARD_CACHE_TTL_MS = 15_000;
const PERFORMANCE_WINDOW_MS = 30 * 60 * 1_000;
const OLLAMA_STATUS_SOFT_TIMEOUT_MS = 1_000;
const OLLAMA_TAGS_SOFT_TIMEOUT_MS = 1_200;
const OPENROUTER_HEALTH_SOFT_TIMEOUT_MS = 1_500;
const OPENROUTER_GEMMA_HEALTH_SOFT_TIMEOUT_MS = 900;
const GROQ_HEALTH_SOFT_TIMEOUT_MS = 900;
const OLLAMA_STATUS_FAILURE_THRESHOLD = 2;
const OLLAMA_TAGS_FAILURE_THRESHOLD = 2;

let ollamaStatusCache: {
	value: { online: boolean; latencyMs: number | null };
	expiresAt: number;
} | null = null;
let ollamaStatusPromise: Promise<{ online: boolean; latencyMs: number | null }> | null = null;
let ollamaStatusConsecutiveFailures = 0;

let ollamaTagsCache: {
	value: string[];
	expiresAt: number;
} | null = null;
let ollamaTagsPromise: Promise<string[]> | null = null;
let ollamaTagsConsecutiveFailures = 0;
const dashboardCache = new Map<string, { value: unknown; expiresAt: number }>();

export async function getDashboardSummary(userId?: string) {
	const cacheKey = `summary:${userId ?? "all"}`;
	const cached = readDashboardCache<Awaited<ReturnType<typeof computeDashboardSummary>>>(cacheKey);
	if (cached) {
		return cached;
	}

	const value = await computeDashboardSummary(userId);
	writeDashboardCache(cacheKey, value);
	return value;
}

async function computeDashboardSummary(userId?: string) {
	const questionWhere = userId ? { createdById: userId } : undefined;
	const [totalQuestions, totalUsers, difficultyGroups, confidence] = await Promise.all([
		prisma.question.count({ where: questionWhere }),
		prisma.user.count({ where: userId ? { id: userId } : undefined }),
		prisma.question.groupBy({
			...(questionWhere ? { where: questionWhere } : {}),
			by: ["difficulty"],
			_count: { _all: true },
		}),
		prisma.question.aggregate({
			...(questionWhere ? { where: questionWhere } : {}),
			_avg: { confidence: true },
		}),
	]);
	const counts = toDifficultyCounts(difficultyGroups);

	return {
		totalQuestions,
		totalUsers,
		veryEasyCount: counts.veryEasy,
		easyCount: counts.easy,
		mediumCount: counts.medium,
		hardCount: counts.hard,
		expertCount: counts.expert,
		averageConfidence: Math.round(confidence._avg.confidence ?? 0),
	};
}

export async function getDifficultyDistribution(userId?: string) {
	const groups = await prisma.question.groupBy({
		...(userId ? { where: { createdById: userId } } : {}),
		by: ["difficulty"],
		_count: { _all: true },
	});
	return toDifficultyCounts(groups);
}

export async function getPipelineContribution(userId: string) {
	const cacheKey = `pipeline:${userId}`;
	const cached =
		readDashboardCache<Awaited<ReturnType<typeof computePipelineContribution>>>(cacheKey);
	if (cached) {
		return cached;
	}

	const value = await computePipelineContribution(userId);
	writeDashboardCache(cacheKey, value);
	return value;
}

async function computePipelineContribution(userId: string) {
	const [questionStats, userChunkCount, globalChunkCount, settings, installedTags] =
		await Promise.all([
			prisma.question.aggregate({
				where: { createdById: userId },
				_count: { _all: true },
				_avg: { confidence: true },
			}),
			prisma.ragDocumentChunk.count({ where: { userId } }),
			prisma.ragDocumentChunk.count({ where: { userId: null } }),
			prisma.adminSetting.upsert({
				where: { id: "default" },
				update: {},
				create: { id: "default" },
				select: { aiModel: true },
			}),
			getInstalledOllamaModelsSnapshot(),
		]);
	const [openRouterHealthy, openRouterGemmaHealthy, groqHealthy] = await Promise.all([
		isOpenRouterHealthyCached(),
		isOpenRouterGemmaHealthyCached(),
		isGroqHealthyCached(),
	]);

	const totalQuestions = questionStats._count._all;
	const averageConfidence = Math.round(questionStats._avg.confidence ?? 0);
	const totalChunks = userChunkCount + globalChunkCount;
	const availableModels = MODEL_OPTIONS.filter((option) =>
		isDashboardModelAvailable(
			option,
			installedTags,
			openRouterHealthy,
			openRouterGemmaHealthy,
			groqHealthy,
		),
	);
	const activeOption =
		MODEL_OPTIONS.find((option) => option.key === settings.aiModel) ?? MODEL_OPTIONS[0];
	const activeModelAvailable = availableModels.some((option) => option.key === activeOption.key);
	const confidenceScore = clamp(averageConfidence / 100);
	const volumeScore = clamp(totalQuestions / 25);
	const ragScore = totalChunks > 0 ? clamp(Math.log10(totalChunks + 1) / 2) : 0;
	const fallbackScore = clamp((availableModels.length - 1) / 2);

	const contributions = normalizeContributionScores([
		{
			id: "primary-model",
			label: "Primary Model Reasoning",
			description: `Driven by ${activeOption.label}, weighted by live confidence across ${totalQuestions} classification${totalQuestions === 1 ? "" : "s"}.`,
			raw: 0.52 + confidenceScore * 0.28 + volumeScore * 0.2,
			accent: "from-purple-500 to-fuchsia-500",
			metricLabel: "Avg confidence",
			metricValue: `${averageConfidence}%`,
		},
		{
			id: "rag-grounding",
			label: "RAG Grounding",
			description:
				totalChunks > 0
					? `Estimated from ${totalChunks.toLocaleString()} indexed knowledge chunk${totalChunks === 1 ? "" : "s"} available to the retrieval layer.`
					: "No indexed RAG chunks detected yet, so grounding contribution stays at zero until documents are added.",
			raw: totalChunks > 0 ? 0.16 + ragScore * 0.72 + volumeScore * 0.12 : 0,
			accent: "from-sky-500 to-cyan-500",
			metricLabel: "Indexed chunks",
			metricValue: totalChunks.toLocaleString(),
		},
		{
			id: "fallback-routing",
			label: "Fallback Reliability",
			description:
				availableModels.length > 1
					? `${availableModels.length} model routes are available, so the system can absorb model-specific failures with fallback routing.`
					: "Fallback contribution remains low until more than one model route is available.",
			raw:
				availableModels.length > 1
					? 0.1 + fallbackScore * 0.7 + (activeModelAvailable ? 0.12 : 0) + volumeScore * 0.08
					: 0.05,
			accent: "from-emerald-500 to-teal-500",
			metricLabel: "Available models",
			metricValue: String(availableModels.length),
		},
	]);

	return {
		hasTelemetry: totalQuestions > 0,
		basis:
			"Estimated from live classifications, average confidence, indexed RAG coverage, and locally available fallback models.",
		totalQuestions,
		averageConfidence,
		activeModel: {
			key: activeOption.key,
			label: activeOption.label,
			model: activeOption.model,
			available: activeModelAvailable,
		},
		items: contributions,
	};
}

export async function getProcessingPerformance() {
	const samples = getRecentPerfSamples(PERFORMANCE_WINDOW_MS);
	return summarizeProcessingPerformance(samples, PERFORMANCE_WINDOW_MS);
}

export async function getQuestionTrend(range: TrendRange, userId?: string, now = new Date()) {
	const buckets = createTrendBuckets(range, now);
	const counts = await fetchTrendCountsFromDatabase(range, buckets[0].start, userId);
	return fillTrendBucketsFromCounts(buckets, counts);
}

export async function getQuestions(userId: string | undefined, limit: number) {
	const where = userId ? { createdById: userId } : undefined;
	const [items, total] = await Promise.all([
		prisma.question.findMany({
			...(where ? { where } : {}),
			orderBy: { createdAt: "desc" },
			take: limit,
			select: {
				id: true,
				title: true,
				content: true,
				difficulty: true,
				confidence: true,
				createdAt: true,
			},
		}),
		prisma.question.count({ where }),
	]);

	return { items, total };
}

export async function getDashboardOverview(userId: string) {
	const cacheKey = `overview:${userId}`;
	const cached = readDashboardCache<Awaited<ReturnType<typeof computeDashboardOverview>>>(cacheKey);
	if (cached) {
		return cached;
	}

	const value = await computeDashboardOverview(userId);
	writeDashboardCache(cacheKey, value);
	return value;
}

export async function getDashboardModelStatusSnapshot(userId: string) {
	const cacheKey = `model-status:${userId}`;
	const cached =
		readDashboardCache<Awaited<ReturnType<typeof computeDashboardModelStatusSnapshot>>>(cacheKey);
	if (cached) {
		return cached;
	}

	const value = await computeDashboardModelStatusSnapshot(userId);
	writeDashboardCache(cacheKey, value);
	return value;
}

async function computeDashboardOverview(userId: string) {
	const now = new Date();
	const todayStart = startOfUtcDay(now);
	const rollingWeekStart = new Date(todayStart);
	rollingWeekStart.setUTCDate(rollingWeekStart.getUTCDate() - 6);
	const previousWeekStart = new Date(rollingWeekStart);
	previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 7);
	const weeklyWindows = createOverviewWeeklyWindows(todayStart);

	const [user, overviewMetrics, uploadCount, requestsToday, setting, ollamaStatus] = await Promise.all([
		prisma.user.findUniqueOrThrow({
			where: { id: userId },
			select: {
				name: true,
				points: true,
				role: true,
				lastActivityAt: true,
			},
		}),
		fetchDashboardOverviewMetrics(userId, todayStart, rollingWeekStart, previousWeekStart, weeklyWindows),
		prisma.activityLog.count({
			where: {
				userId,
				actionType: "pdf_uploaded",
			},
		}),
		prisma.question.count({
			where: {
				createdById: userId,
				createdAt: { gte: todayStart },
			},
		}),
		prisma.adminSetting.upsert({
			where: { id: "default" },
			update: {},
			create: { id: "default" },
		}),
		getOllamaStatusSnapshot(),
	]);

	const totalQuestions = overviewMetrics.totalQuestions;
	const questionsToday = overviewMetrics.questionsToday;
	const questionsThisWeek = overviewMetrics.questionsThisWeek;
	const previousWeekQuestions = overviewMetrics.previousWeekQuestions;
	const trailingFourWeekCounts = [
		overviewMetrics.week0Count,
		overviewMetrics.week1Count,
		overviewMetrics.week2Count,
		overviewMetrics.week3Count,
	];
	const averageConfidence = overviewMetrics.averageConfidence ?? 0;
	const streak = calculateClassificationStreak(
		(overviewMetrics.recentDates ?? []).map((value) => new Date(value)),
		now,
	);
	const frequentDifficulty = findMostCommonDifficulty(
		overviewMetrics.recentWeekDifficulties ?? [],
	);
	const hardestTopic = extractTopicLabel(
		(overviewMetrics.hardQuestionTitles ?? []).map((title) => ({ title })),
	);
	const suggestedTopic = extractTopicLabel(
		(overviewMetrics.suggestedTitles ?? []).map((title) => ({ title })),
	);
	const weeklyGoalTarget = calculateWeeklyGoalTarget(trailingFourWeekCounts, questionsThisWeek);
	const dailyGoalTarget = calculateDailyGoalTarget(weeklyGoalTarget);
	const weeklyGoalPercentage = Math.min(
		100,
		Math.round((questionsThisWeek / weeklyGoalTarget) * 100),
	);
	const trendDirection = describeTrend(questionsThisWeek, previousWeekQuestions);
	const modelStatus = await getDashboardModelStatus({
		activeModel: setting.aiModel,
		averageConfidence,
		requestsToday,
		activeModelLatencyMs: ollamaStatus.latencyMs,
		canSwitchModels: false,
	});

	return {
		welcome: {
			greeting: getGreeting(now),
			userName: user.name,
			questionsToday,
			currentStreak: streak.current,
			currentLevel: calculateLevel(user.points),
			goalCompleted: questionsToday,
			goalTarget: dailyGoalTarget,
		},
		dailyStreak: {
			current: streak.current,
			longest: streak.longest,
			lastActivity: user.lastActivityAt?.toISOString() ?? null,
			lastActivityLabel: formatLastActivityLabel(user.lastActivityAt, now),
			progress: Math.min(
				100,
				Math.round((streak.current / Math.max(streak.longest || 1, 7)) * 100),
			),
		},
		weeklyGoal: {
			completed: questionsThisWeek,
			target: weeklyGoalTarget,
			remaining: Math.max(0, weeklyGoalTarget - questionsThisWeek),
			percentage: weeklyGoalPercentage,
		},
		achievements: [
			{
				id: "first-classification",
				label: "First Classification",
				icon: "🏆",
				unlocked: totalQuestions >= 1,
			},
			{
				id: "pdf-master",
				label: "PDF Master",
				icon: "📄",
				unlocked: uploadCount >= 1,
			},
			{
				id: "hundred-questions",
				label: "100 Questions Classified",
				icon: "⚡",
				unlocked: totalQuestions >= 100,
			},
			{
				id: "high-confidence",
				label: "95%+ Confidence",
				icon: "🎯",
				unlocked: overviewMetrics.highConfidenceCount > 0,
			},
		],
		insights: [
			`Most classified category this week: ${frequentDifficulty}.`,
			`Average confidence is ${averageConfidence}% across your recent classifications.`,
			`Hardest topic recently: ${hardestTopic}.`,
			`Suggested topic to practice next: ${suggestedTopic}.`,
			`Classification trend: ${trendDirection}.`,
		],
		modelStatus,
	};
}

async function computeDashboardModelStatusSnapshot(userId: string) {
	const now = new Date();
	const todayStart = startOfUtcDay(now);
	const [questionStats, requestsToday, setting, ollamaStatus] = await Promise.all([
		prisma.question.aggregate({
			where: { createdById: userId },
			_avg: { confidence: true },
		}),
		prisma.question.count({
			where: {
				createdById: userId,
				createdAt: { gte: todayStart },
			},
		}),
		prisma.adminSetting.upsert({
			where: { id: "default" },
			update: {},
			create: { id: "default" },
			select: { aiModel: true },
		}),
		getOllamaStatusSnapshot(),
	]);

	return getDashboardModelStatus({
		activeModel: setting.aiModel,
		averageConfidence: Math.round(questionStats._avg.confidence ?? 0),
		requestsToday,
		activeModelLatencyMs: ollamaStatus.latencyMs,
		canSwitchModels: false,
	});
}

export async function getDashboardModelStatus(input: {
	activeModel: string;
	averageConfidence: number;
	requestsToday: number;
	activeModelLatencyMs: number | null;
	canSwitchModels: boolean;
}) {
	const [tags, openRouterHealthy, openRouterGemmaHealthy, groqHealthy] = await Promise.all([
		getInstalledOllamaModelsSnapshot(),
		resolveWithSoftTimeout(
			isOpenRouterHealthyCached(),
			false,
			OPENROUTER_HEALTH_SOFT_TIMEOUT_MS,
		),
		resolveWithSoftTimeout(
			isOpenRouterGemmaHealthyCached(),
			false,
			OPENROUTER_GEMMA_HEALTH_SOFT_TIMEOUT_MS,
		),
		resolveWithSoftTimeout(isGroqHealthyCached(), false, GROQ_HEALTH_SOFT_TIMEOUT_MS),
	]);
	const activeOption =
		MODEL_OPTIONS.find((option) => option.key === input.activeModel) ?? MODEL_OPTIONS[0];
	const models = MODEL_OPTIONS.map((option) => {
		const available = isDashboardModelAvailable(
			option,
			tags,
			openRouterHealthy,
			openRouterGemmaHealthy,
			groqHealthy,
		);

		return {
			key: option.key,
			label: option.label,
			model: option.model,
			available,
			status: available ? "Online" : "Offline",
			isActive: option.key === activeOption.key,
		};
	});

	return {
		status: models.some((model) => model.isActive && model.available) ? "Online" : "Offline",
		model: activeOption.model,
		modelLabel: activeOption.label,
		activeModel: activeOption.key,
		latencyMs:
			activeOption.provider === "ollama" && models.some((model) => model.isActive && model.available)
				? input.activeModelLatencyMs
				: null,
		averageConfidence: input.averageConfidence,
		requestsToday: input.requestsToday,
		progress: input.averageConfidence,
		canSwitchModels: input.canSwitchModels,
		models,
	};
}

export async function setDashboardActiveModel(model: string) {
	const settings = await prisma.adminSetting.upsert({
		where: { id: "default" },
		update: { aiModel: model },
		create: { id: "default", aiModel: model },
	});

	return settings.aiModel;
}

interface DifficultyGroup {
	difficulty: string | null;
	_count: { _all: number };
}

function toDifficultyCounts(groups: DifficultyGroup[]) {
	const values = new Map(groups.map((group) => [group.difficulty, group._count._all]));
	return {
		veryEasy: values.get(DIFFICULTY_KEYS[0]) ?? 0,
		easy: values.get(DIFFICULTY_KEYS[1]) ?? 0,
		medium: values.get(DIFFICULTY_KEYS[2]) ?? 0,
		hard: values.get(DIFFICULTY_KEYS[3]) ?? 0,
		expert: values.get(DIFFICULTY_KEYS[4]) ?? 0,
	};
}

interface PipelineContributionInput {
	id: string;
	label: string;
	description: string;
	raw: number;
	accent: string;
	metricLabel: string;
	metricValue: string;
}

interface PerformanceSummary {
	averageMs: number;
	p95Ms: number;
	sampleCount: number;
}

export function normalizeContributionScores(items: PipelineContributionInput[]) {
	const sanitized = items.map((item) => ({
		...item,
		raw: Number.isFinite(item.raw) && item.raw > 0 ? item.raw : 0,
	}));
	const total = sanitized.reduce((sum, item) => sum + item.raw, 0);

	if (total <= 0) {
		return sanitized.map((item) => ({
			...item,
			percentage: 0,
		}));
	}

	const scaled = sanitized.map((item) => ({
		...item,
		percentage: Math.max(0, Math.round((item.raw / total) * 100)),
	}));
	const roundedTotal = scaled.reduce((sum, item) => sum + item.percentage, 0);
	const delta = 100 - roundedTotal;

	if (delta !== 0) {
		const target = [...scaled].sort((left, right) => right.raw - left.raw)[0];
		if (target) {
			target.percentage += delta;
		}
	}

	return scaled;
}

export function summarizeProcessingPerformance(samples: PerfMetricSample[], windowMs: number) {
	const classificationSamples = samples.filter((sample) => sample.name === "classification_request");
	const answerSamples = samples.filter(
		(sample) => sample.name === "answer_request" || sample.name === "answer_stream_request",
	);

	return {
		hasTelemetry: samples.length > 0,
		windowMinutes: Math.round(windowMs / 60_000),
		capturedAt: new Date().toISOString(),
		classification: buildPerformanceOperationSummary(classificationSamples, {
			operationKey: "classification",
			label: "Classification",
			stepLabels: {
				total: "Total request",
				rag_retrieval: "RAG retrieval",
				prisma_write: "Database write",
				post_response_side_effects: "Post-response side effects",
			},
		}),
		answer: buildPerformanceOperationSummary(answerSamples, {
			operationKey: "answer",
			label: "Answer generation",
			stepLabels: {
				total: "Total request",
				rag_retrieval: "RAG retrieval",
				answer_review: "Answer review",
			},
		}),
	};
}

function buildPerformanceOperationSummary(
	samples: PerfMetricSample[],
	input: {
		operationKey: string;
		label: string;
		stepLabels: Record<string, string>;
	},
) {
	const totalSamples = samples.filter((sample) => sample.step === "total");
	const stageEntries = Object.entries(input.stepLabels)
		.filter(([step]) => step !== "total")
		.map(([step, label]) => ({
			key: `${input.operationKey}:${step}`,
			step,
			label,
			...summarizePerfDurations(samples.filter((sample) => sample.step === step)),
		}))
		.filter((entry) => entry.sampleCount > 0);
	const llmCalls = summarizeLlmCalls(samples);

	return {
		key: input.operationKey,
		label: input.label,
		total: summarizePerfDurations(totalSamples),
		stages: stageEntries,
		llmCalls,
	};
}

function summarizeLlmCalls(samples: PerfMetricSample[]) {
	const grouped = new Map<string, PerfMetricSample[]>();

	for (const sample of samples) {
		if (sample.step !== "llm_call") {
			continue;
		}

		const provider = readContextString(sample, "provider") || "unknown";
		const model = readContextString(sample, "model") || "unknown";
		const key = `${provider}:${model}`;
		const bucket = grouped.get(key);
		if (bucket) {
			bucket.push(sample);
			continue;
		}
		grouped.set(key, [sample]);
	}

	return [...grouped.entries()]
		.map(([key, items]) => {
			const separatorIndex = key.indexOf(":");
			const provider = separatorIndex >= 0 ? key.slice(0, separatorIndex) : key;
			const model = separatorIndex >= 0 ? key.slice(separatorIndex + 1) : "unknown";
			return {
				key,
				provider,
				model,
				...summarizePerfDurations(items),
			};
		})
		.sort((left, right) => right.sampleCount - left.sampleCount || left.averageMs - right.averageMs);
}

function summarizePerfDurations(samples: PerfMetricSample[]): PerformanceSummary {
	if (samples.length === 0) {
		return {
			averageMs: 0,
			p95Ms: 0,
			sampleCount: 0,
		};
	}

	const durations = samples
		.map((sample) => sample.durationMs)
		.filter((value) => Number.isFinite(value))
		.sort((left, right) => left - right);

	if (durations.length === 0) {
		return {
			averageMs: 0,
			p95Ms: 0,
			sampleCount: 0,
		};
	}

	return {
		averageMs: Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
		p95Ms: calculatePercentile(durations, 0.95),
		sampleCount: durations.length,
	};
}

export function calculatePercentile(values: number[], percentile: number) {
	if (values.length === 0) {
		return 0;
	}

	const bounded = Math.min(1, Math.max(0, percentile));
	const index = Math.min(values.length - 1, Math.max(0, Math.ceil(values.length * bounded) - 1));
	return Math.round(values[index] ?? 0);
}

function readContextString(sample: PerfMetricSample, key: string) {
	const value = sample.context[key];
	return typeof value === "string" ? value : "";
}

interface TrendBucket {
	start: Date;
	end: Date;
	date: string;
}

interface TrendCountRow {
	bucketKey: string;
	count: number;
}

interface DashboardOverviewMetricsRow {
	totalQuestions: number;
	questionsToday: number;
	questionsThisWeek: number;
	previousWeekQuestions: number;
	averageConfidence: number | null;
	highConfidenceCount: number;
	week0Count: number;
	week1Count: number;
	week2Count: number;
	week3Count: number;
	recentDates: string[] | null;
	recentWeekDifficulties: Array<string | null> | null;
	hardQuestionTitles: string[] | null;
	suggestedTitles: string[] | null;
}

export function createTrendBuckets(range: TrendRange, now: Date): TrendBucket[] {
	const end = startOfUtcDay(now);

	if (range === "year") {
		const currentMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
		return Array.from({ length: 12 }, (_, index) => {
			const start = new Date(
				Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 11 + index, 1),
			);
			return {
				start,
				end: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)),
				date: start.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
			};
		});
	}

	const days = range === "month" ? 30 : 7;
	return Array.from({ length: days }, (_, index) => {
		const start = new Date(end);
		start.setUTCDate(end.getUTCDate() - days + index + 1);
		const bucketEnd = new Date(start);
		bucketEnd.setUTCDate(start.getUTCDate() + 1);
		return {
			start,
			end: bucketEnd,
			date: start.toLocaleDateString("en-US", {
				...(range === "week" ? { weekday: "short" } : { month: "short", day: "numeric" }),
				timeZone: "UTC",
			}),
		};
	});
}

export function fillTrendBuckets(buckets: TrendBucket[], questions: Array<{ createdAt: Date }>) {
	return buckets.map((bucket) => ({
		date: bucket.date,
		value: questions.filter(
			(question) => question.createdAt >= bucket.start && question.createdAt < bucket.end,
		).length,
	}));
}

export function fillTrendBucketsFromCounts(
	buckets: TrendBucket[],
	counts: Map<string, number> | Record<string, number>,
) {
	const countMap = counts instanceof Map ? counts : new Map(Object.entries(counts));
	return buckets.map((bucket) => ({
		date: bucket.date,
		value: countMap.get(getTrendBucketKeyForRange(bucket.start, bucket.end)) ?? 0,
	}));
}

function startOfUtcDay(value: Date) {
	return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function getTrendBucketKeyForRange(start: Date, end: Date) {
	const daySpan = Math.round((end.getTime() - start.getTime()) / 86_400_000);
	return daySpan > 1 ? start.toISOString().slice(0, 7) : start.toISOString().slice(0, 10);
}

function calculateAverageConfidence(questions: Array<{ confidence: number | null }>) {
	const values = questions
		.map((question) => Number(question.confidence ?? 0))
		.filter((confidence) => Number.isFinite(confidence) && confidence > 0);

	if (values.length === 0) {
		return 0;
	}

	return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function calculateClassificationStreak(dates: Date[], now: Date) {
	const uniqueDays = [...new Set(dates.map(toUtcDayKey))]
		.map((key) => new Date(`${key}T00:00:00.000Z`))
		.sort((left, right) => right.getTime() - left.getTime());

	if (uniqueDays.length === 0) {
		return { current: 0, longest: 0 };
	}

	let longest = 1;
	let running = 1;

	for (let index = 1; index < uniqueDays.length; index += 1) {
		const difference = getUtcDayDifference(uniqueDays[index], uniqueDays[index - 1]);
		if (difference === 1) {
			running += 1;
			longest = Math.max(longest, running);
		} else {
			running = 1;
		}
	}

	const current = calculateCurrentStreak(uniqueDays, now);
	return { current, longest };
}

function calculateCurrentStreak(days: Date[], now: Date) {
	const [latestDay] = days;
	if (!latestDay) {
		return 0;
	}

	const latestDifference = getUtcDayDifference(latestDay, startOfUtcDay(now));
	if (latestDifference > 1) {
		return 0;
	}

	let streak = 1;
	for (let index = 1; index < days.length; index += 1) {
		const difference = getUtcDayDifference(days[index], days[index - 1]);
		if (difference === 1) {
			streak += 1;
			continue;
		}
		break;
	}

	return streak;
}

function findMostCommonDifficulty(values: Array<string | null>) {
	const counts = new Map<string, number>();
	for (const value of values) {
		const label = formatDifficultyLabel(value);
		counts.set(label, (counts.get(label) ?? 0) + 1);
	}

	return (
		[...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Not enough data"
	);
}

function extractTopicLabel(questions: Array<{ title: string }>) {
	const counts = new Map<string, number>();

	for (const question of questions) {
		for (const token of tokenizeTopic(question.title)) {
			counts.set(token, (counts.get(token) ?? 0) + 1);
		}
	}

	const topic = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
	return topic ? topic.charAt(0).toUpperCase() + topic.slice(1) : "Foundations";
}

function tokenizeTopic(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.map((token) => token.trim())
		.filter((token) => token.length > 2 && !TOPIC_STOP_WORDS.has(token));
}

function describeTrend(current: number, previous: number) {
	if (current === 0 && previous === 0) {
		return "No weekly trend yet — classify a few questions to build momentum.";
	}

	if (previous === 0) {
		return `Started with ${current} classification${current === 1 ? "" : "s"} this week.`;
	}

	const difference = current - previous;
	if (difference > 0) {
		return `Up ${difference} classifications versus the previous week.`;
	}
	if (difference < 0) {
		return `Down ${Math.abs(difference)} classifications versus the previous week.`;
	}
	return "Steady compared with the previous week.";
}

function calculateWeeklyGoalTarget(weeklyCounts: number[], currentWeekCount: number) {
	const meaningfulWeeks = weeklyCounts.filter((count) => count > 0);
	if (meaningfulWeeks.length === 0) {
		return Math.max(10, roundUpToNearestFive(Math.max(currentWeekCount, 5)));
	}

	const baseline = meaningfulWeeks.reduce((sum, count) => sum + count, 0) / meaningfulWeeks.length;
	return Math.min(
		100,
		Math.max(10, roundUpToNearestFive(Math.max(currentWeekCount, baseline + 3))),
	);
}

export function calculateDailyGoalTarget(weeklyGoalTarget: number) {
	return Math.max(5, roundUpToNearestFive(Math.max(1, weeklyGoalTarget) / 7));
}

function buildWeeklyQuestionCounts(
	questions: Array<{ createdAt: Date }>,
	todayStart: Date,
	weeks: number,
) {
	return Array.from({ length: weeks }, (_, index) => {
		const end = new Date(todayStart);
		end.setUTCDate(end.getUTCDate() - index * 7 + 1);
		const start = new Date(end);
		start.setUTCDate(end.getUTCDate() - 7);

		return questions.filter((question) => question.createdAt >= start && question.createdAt < end)
			.length;
	});
}

function createOverviewWeeklyWindows(todayStart: Date) {
	return Array.from({ length: 4 }, (_, index) => {
		const end = new Date(todayStart);
		end.setUTCDate(end.getUTCDate() - index * 7 + 1);
		const start = new Date(end);
		start.setUTCDate(end.getUTCDate() - 7);
		return { start, end };
	});
}

async function fetchTrendCountsFromDatabase(
	range: TrendRange,
	start: Date,
	userId?: string,
) {
	const bucketUnit = range === "year" ? "month" : "day";
	const bucketFormat = range === "year" ? "YYYY-MM" : "YYYY-MM-DD";
	const createdByClause = userId ? 'AND "createdById" = $2' : "";
	const values = userId ? [start, userId] : [start];
	const rows = await prisma.$queryRawUnsafe<TrendCountRow[]>(
		`
			SELECT
				TO_CHAR(date_trunc('${bucketUnit}', timezone('UTC', "createdAt")), '${bucketFormat}') AS "bucketKey",
				COUNT(*)::int AS "count"
			FROM "questions"
			WHERE "createdAt" >= $1
			${createdByClause}
			GROUP BY 1
		`,
		...values,
	);

	return new Map(rows.map((row) => [row.bucketKey, Number(row.count)]));
}

async function fetchDashboardOverviewMetrics(
	userId: string,
	todayStart: Date,
	rollingWeekStart: Date,
	previousWeekStart: Date,
	weeklyWindows: Array<{ start: Date; end: Date }>,
) {
	const [currentWeek, priorWeekOne, priorWeekTwo, priorWeekThree] = weeklyWindows;
	const rows = await prisma.$queryRaw<DashboardOverviewMetricsRow[]>`
		WITH recent_questions AS (
			SELECT "title", "difficulty", "confidence", "createdAt"
			FROM "questions"
			WHERE "createdById" = ${userId}
			ORDER BY "createdAt" DESC
			LIMIT 250
		)
		SELECT
			COUNT(*)::int AS "totalQuestions",
			COUNT(*) FILTER (WHERE "createdAt" >= ${todayStart})::int AS "questionsToday",
			COUNT(*) FILTER (WHERE "createdAt" >= ${rollingWeekStart})::int AS "questionsThisWeek",
			COUNT(*) FILTER (
				WHERE "createdAt" >= ${previousWeekStart} AND "createdAt" < ${rollingWeekStart}
			)::int AS "previousWeekQuestions",
			COALESCE(ROUND(AVG("confidence") FILTER (WHERE "confidence" > 0)), 0)::int AS "averageConfidence",
			COUNT(*) FILTER (WHERE COALESCE("confidence", 0) >= 95)::int AS "highConfidenceCount",
			COUNT(*) FILTER (
				WHERE "createdAt" >= ${currentWeek.start} AND "createdAt" < ${currentWeek.end}
			)::int AS "week0Count",
			COUNT(*) FILTER (
				WHERE "createdAt" >= ${priorWeekOne.start} AND "createdAt" < ${priorWeekOne.end}
			)::int AS "week1Count",
			COUNT(*) FILTER (
				WHERE "createdAt" >= ${priorWeekTwo.start} AND "createdAt" < ${priorWeekTwo.end}
			)::int AS "week2Count",
			COUNT(*) FILTER (
				WHERE "createdAt" >= ${priorWeekThree.start} AND "createdAt" < ${priorWeekThree.end}
			)::int AS "week3Count",
			COALESCE(
				(
					SELECT json_agg("createdAt" ORDER BY "createdAt" DESC)
					FROM recent_questions
				),
				'[]'::json
			) AS "recentDates",
			COALESCE(
				(
					SELECT json_agg("difficulty" ORDER BY "createdAt" DESC)
					FROM recent_questions
					WHERE "createdAt" >= ${rollingWeekStart}
				),
				'[]'::json
			) AS "recentWeekDifficulties",
			COALESCE(
				(
					SELECT json_agg("title" ORDER BY "createdAt" DESC)
					FROM recent_questions
					WHERE "difficulty" IN ('hard', 'expert')
				),
				'[]'::json
			) AS "hardQuestionTitles",
			COALESCE(
				(
					SELECT json_agg("title" ORDER BY "createdAt" DESC)
					FROM (
						SELECT "title", "createdAt"
						FROM recent_questions
						ORDER BY "createdAt" DESC
						LIMIT 25
					) recent_titles
				),
				'[]'::json
			) AS "suggestedTitles"
		FROM recent_questions
	`;

	return (
		rows[0] ?? {
			totalQuestions: 0,
			questionsToday: 0,
			questionsThisWeek: 0,
			previousWeekQuestions: 0,
			averageConfidence: 0,
			highConfidenceCount: 0,
			week0Count: 0,
			week1Count: 0,
			week2Count: 0,
			week3Count: 0,
			recentDates: [],
			recentWeekDifficulties: [],
			hardQuestionTitles: [],
			suggestedTitles: [],
		}
	);
}

function roundUpToNearestFive(value: number) {
	return Math.ceil(value / 5) * 5;
}

function clamp(value: number, min = 0, max = 1) {
	return Math.min(max, Math.max(min, value));
}

function calculateLevel(points: number) {
	return Math.max(1, Math.floor(points / 75) + 1);
}

function getGreeting(now: Date) {
	const hour = now.getHours();
	if (hour < 12) return "Good Morning";
	if (hour < 18) return "Good Afternoon";
	return "Good Evening";
}

function formatLastActivityLabel(value: Date | null, now: Date) {
	if (!value) {
		return "No recent activity";
	}

	const difference = getUtcDayDifference(startOfUtcDay(value), startOfUtcDay(now));
	if (difference === 0) return "Today";
	if (difference === 1) return "Yesterday";
	return value.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function formatDifficultyLabel(value: string | null) {
	if (!value) return "Unclassified";
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function toUtcDayKey(value: Date) {
	return value.toISOString().slice(0, 10);
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

async function getOllamaStatus() {
	if (!env.OLLAMA_BASE_URL) {
		return {
			online: false,
			latencyMs: null,
		};
	}

	const startedAt = performance.now();
	try {
		const response = await fetch(`${env.OLLAMA_BASE_URL}/api/version`, {
			headers: buildOllamaHeaders(),
			signal: AbortSignal.timeout(3_000),
		});

		return {
			online: response.ok,
			latencyMs: Math.round(performance.now() - startedAt),
		};
	} catch {
		return {
			online: false,
			latencyMs: null,
		};
	}
}

async function getInstalledOllamaModels() {
	if (!env.OLLAMA_BASE_URL) {
		return [];
	}

	try {
		const response = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, {
			headers: buildOllamaHeaders(),
			signal: AbortSignal.timeout(3_000),
		});

		if (!response.ok) {
			return [];
		}

		const payload = (await response.json()) as {
			models?: Array<{ name?: string; model?: string }>;
		};

		return (payload.models ?? []).map((item) => item.name ?? item.model ?? "").filter(Boolean);
	} catch {
		return [];
	}
}

async function getOllamaStatusCached() {
	const now = Date.now();
	if (ollamaStatusCache && ollamaStatusCache.expiresAt > now) {
		return ollamaStatusCache.value;
	}

	if (!ollamaStatusPromise) {
		ollamaStatusPromise = getOllamaStatus()
			.then((value) => {
				if (value.online) {
					ollamaStatusConsecutiveFailures = 0;
					ollamaStatusCache = {
						value,
						expiresAt: Date.now() + OLLAMA_STATUS_CACHE_TTL_MS,
					};
					return value;
				}

				ollamaStatusConsecutiveFailures += 1;
				if (ollamaStatusCache && ollamaStatusConsecutiveFailures < OLLAMA_STATUS_FAILURE_THRESHOLD) {
					return ollamaStatusCache.value;
				}

				ollamaStatusCache = {
					value,
					expiresAt: Date.now() + OLLAMA_STATUS_CACHE_TTL_MS,
				};
				return value;
			})
			.finally(() => {
				ollamaStatusPromise = null;
			});
	}

	return ollamaStatusPromise;
}

async function getOllamaStatusSnapshot() {
	const fallback = ollamaStatusCache?.value ?? {
		online: false,
		latencyMs: null,
	};
	return resolveWithSoftTimeout(getOllamaStatusCached(), fallback, OLLAMA_STATUS_SOFT_TIMEOUT_MS);
}

async function getInstalledOllamaModelsCached() {
	const now = Date.now();
	if (ollamaTagsCache && ollamaTagsCache.expiresAt > now) {
		return ollamaTagsCache.value;
	}

	if (!ollamaTagsPromise) {
		ollamaTagsPromise = getInstalledOllamaModels()
			.then((value) => {
				if (value.length > 0) {
					ollamaTagsConsecutiveFailures = 0;
					ollamaTagsCache = {
						value,
						expiresAt: Date.now() + OLLAMA_TAGS_CACHE_TTL_MS,
					};
					return value;
				}

				ollamaTagsConsecutiveFailures += 1;
				if (ollamaTagsCache && ollamaTagsConsecutiveFailures < OLLAMA_TAGS_FAILURE_THRESHOLD) {
					return ollamaTagsCache.value;
				}

				ollamaTagsCache = {
					value,
					expiresAt: Date.now() + OLLAMA_TAGS_CACHE_TTL_MS,
				};
				return value;
			})
			.finally(() => {
				ollamaTagsPromise = null;
			});
	}

	return ollamaTagsPromise;
}

async function getInstalledOllamaModelsSnapshot() {
	const fallback = ollamaTagsCache?.value ?? [];
	return resolveWithSoftTimeout(
		getInstalledOllamaModelsCached(),
		fallback,
		OLLAMA_TAGS_SOFT_TIMEOUT_MS,
	);
}

function resolveWithSoftTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs: number) {
	return new Promise<T>((resolve) => {
		let settled = false;
		const timeoutId = setTimeout(() => {
			if (settled) return;
			settled = true;
			resolve(fallback);
		}, timeoutMs);

		promise
			.then((value) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeoutId);
				resolve(value);
			})
			.catch(() => {
				if (settled) return;
				settled = true;
				clearTimeout(timeoutId);
				resolve(fallback);
			});
	});
}

function matchesModelTag(tag: string, configuredModel: string) {
	const normalizedTag = tag.trim().toLowerCase();
	const normalizedModel = configuredModel.trim().toLowerCase();

	return (
		normalizedTag === normalizedModel ||
		normalizedTag.startsWith(`${normalizedModel}:`) ||
		normalizedModel.startsWith(`${normalizedTag}:`) ||
		normalizedTag.split(":")[0] === normalizedModel.split(":")[0]
	);
}

function isDashboardModelAvailable(
	option: (typeof MODEL_OPTIONS)[number],
	installedTags: string[],
	openRouterHealthy: boolean,
	openRouterGemmaHealthy: boolean,
	groqHealthy: boolean,
) {
	if (option.key === "groq") {
		return isGroqConfigured() && groqHealthy;
	}
	if (option.key === "gemma") {
		return isOpenRouterGemmaConfigured() && openRouterGemmaHealthy;
	}
	if (option.provider === "openrouter") {
		return isOpenRouterNemotronConfigured() && openRouterHealthy;
	}

	return installedTags.some((tag) => matchesModelTag(tag, option.model));
}

function readDashboardCache<T>(key: string) {
	const cached = dashboardCache.get(key);
	if (!cached || cached.expiresAt <= Date.now()) {
		dashboardCache.delete(key);
		return null;
	}
	return cached.value as T;
}

function writeDashboardCache(key: string, value: unknown) {
	dashboardCache.set(key, {
		value,
		expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
	});
}

const TOPIC_STOP_WORDS = new Set([
	"about",
	"after",
	"before",
	"between",
	"calculate",
	"classify",
	"define",
	"describe",
	"determine",
	"different",
	"explain",
	"find",
	"from",
	"have",
	"into",
	"name",
	"question",
	"questions",
	"their",
	"there",
	"these",
	"this",
	"those",
	"what",
	"which",
	"with",
]);
