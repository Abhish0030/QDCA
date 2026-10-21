import { prisma } from "../../../database";
import { env } from "../../../config/env";
import { generationOptions, requestOllama } from "./ollama-client";
import { detectQuestionSubject } from "./subject-detection-service";

interface SimilarQuestionMatch {
	id: string;
	question: string;
	source: string;
	difficulty: string | null;
	score: number;
}

interface SimilarQuestionAssistantInsights {
	summary: string;
	suggestedQueries: string[];
	detectedSubject: string;
	relatedTopics: string[];
	model: string | null;
	fallback: boolean;
}

export interface SimilarQuestionsResponse {
	matches: SimilarQuestionMatch[];
	assistant: SimilarQuestionAssistantInsights;
}

const STOP_WORDS = new Set([
	"a",
	"an",
	"and",
	"are",
	"for",
	"how",
	"in",
	"is",
	"of",
	"on",
	"the",
	"to",
	"what",
	"why",
]);

const SIMILARITY_ASSISTANT_MODEL = env.OLLAMA_FAST_MODEL?.trim() || "gemma3:1b";
const SIMILARITY_ASSISTANT_TIMEOUT_MS = 7_000;
const SIMILARITY_SUBJECT_TIMEOUT_MS = 4_000;

const similarQuestionInsightsJsonSchema = {
	type: "object",
	additionalProperties: false,
	required: ["summary", "suggestedQueries"],
	properties: {
		summary: { type: "string" },
		suggestedQueries: {
			type: "array",
			maxItems: 4,
			items: { type: "string" },
		},
	},
} as const;

export async function findSimilarQuestions(
	userId: string,
	questionText: string,
	limit = 8,
): Promise<SimilarQuestionsResponse> {
	const questions = await prisma.question.findMany({
		where: { createdById: userId },
		orderBy: { createdAt: "desc" },
		take: 250,
		select: { id: true, title: true, content: true, difficulty: true },
	});

	const matches = questions
		.map((question) => ({
			id: question.id,
			question: question.title || question.content || "Untitled question",
			source: "Question bank",
			difficulty: formatDifficulty(question.difficulty),
			score: calculateSimilarity(questionText, `${question.title} ${question.content ?? ""}`),
		}))
		.filter((question) => question.score >= 0.12)
		.sort((left, right) => right.score - left.score)
		.slice(0, limit);

	const assistant = await buildSimilarQuestionInsights(questionText, matches);

	return { matches, assistant };
}

export async function buildStudyRoadmap(userId: string) {
	const questions = await prisma.question.findMany({
		where: { createdById: userId },
		orderBy: { createdAt: "desc" },
		take: 50,
		select: { title: true, difficulty: true },
	});
	const topicNames = extractTopicNames(questions.map((question) => question.title));
	const completed = Math.min(2, Math.floor(questions.length / 10));
	const percentage = Math.min(90, Math.max(10, Math.round((questions.length / 100) * 100)));

	return {
		summary:
			questions.length > 0
				? `Your roadmap is based on ${questions.length} recent classifications and adapts as you analyze more questions.`
				: "Analyze questions to personalize this learning roadmap.",
		overall: { percentage },
		subjects: [
			{
				subject: "Personal Learning Path",
				topics: topicNames.map((name, index) => ({
					name,
					status: index < completed ? "completed" : index === completed ? "in_progress" : "locked",
				})),
			},
		],
	};
}

export function calculateSimilarity(left: string, right: string) {
	const leftTokens = tokenize(left);
	const rightTokens = tokenize(right);
	if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
	const tokenScore = jaccardDiceScore(leftTokens, rightTokens);
	const compactScore = compactForm(left) === compactForm(right) ? 1 : 0;
	const substringScore = hasImportantSubstringMatch(leftTokens, rightTokens) ? 0.78 : 0;
	const charScore = diceCoefficient(
		charNgrams(normalizeText(left), 3),
		charNgrams(normalizeText(right), 3),
	);
	const keywordScore = keywordCoverage(leftTokens, rightTokens);

	return Math.max(tokenScore, compactScore, substringScore, charScore * 0.92, keywordScore * 0.88);
}

function tokenize(value: string) {
	return new Set(splitIntoSearchTerms(value));
}

function stemToken(token: string) {
	return token
		.replace(/(ization|isation|ation|ment)$/i, "")
		.replace(/(ied)$/i, "y")
		.replace(/(ing|ed|es|s)$/i, "");
}

function extractTopicNames(titles: string[]) {
	const counts = new Map<string, number>();
	for (const title of titles) {
		for (const token of tokenize(title)) counts.set(token, (counts.get(token) ?? 0) + 1);
	}
	const topics = [...counts.entries()]
		.sort((left, right) => right[1] - left[1])
		.slice(0, 6)
		.map(([token]) => token.charAt(0).toUpperCase() + token.slice(1));
	return topics.length >= 3
		? topics
		: [
				"Foundations",
				"Core Concepts",
				"Applied Practice",
				"Problem Solving",
				"Analysis",
				"Mastery",
			];
}

function formatDifficulty(value: string | null) {
	if (!value) return null;
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

async function buildSimilarQuestionInsights(
	questionText: string,
	matches: SimilarQuestionMatch[],
): Promise<SimilarQuestionAssistantInsights> {
	const subject = await withTimeout(
		detectQuestionSubject(questionText),
		SIMILARITY_SUBJECT_TIMEOUT_MS,
	).catch(() => detectSubjectLocallyFallback(questionText));
	const fallbackInsights = buildFallbackInsights(questionText, matches, subject.primarySubject, [
		...subject.topics,
		...subject.subtopics,
	]);

	try {
		const payload = await requestOllama<{ response?: string }>(
			"/api/generate",
			{
				model: SIMILARITY_ASSISTANT_MODEL,
				stream: false,
				format: similarQuestionInsightsJsonSchema,
				options: generationOptions(0.2, 220, 21),
				prompt: buildSimilarQuestionPrompt(questionText, matches, subject.primarySubject, [
					...subject.topics,
					...subject.subtopics,
				]),
			},
			SIMILARITY_ASSISTANT_TIMEOUT_MS,
		);

		const parsed = parseSimilarQuestionInsights(payload.response ?? "");

		return {
			summary: parsed.summary,
			suggestedQueries: sanitizeSuggestedQueries(
				parsed.suggestedQueries,
				questionText,
				subject.primarySubject,
				[...subject.topics, ...subject.subtopics],
			),
			detectedSubject: subject.primarySubject,
			relatedTopics: [...subject.topics, ...subject.subtopics].slice(0, 6),
			model: SIMILARITY_ASSISTANT_MODEL,
			fallback: false,
		};
	} catch {
		return fallbackInsights;
	}
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
	return new Promise<T>((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error(`Operation timed out after ${timeoutMs}ms`));
		}, timeoutMs);

		promise.then(
			(value) => {
				clearTimeout(timeoutId);
				resolve(value);
			},
			(error) => {
				clearTimeout(timeoutId);
				reject(error);
			},
		);
	});
}

function parseSimilarQuestionInsights(response: string) {
	const cleaned = response
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/, "");
	return JSON.parse(cleaned) as { summary: string; suggestedQueries: string[] };
}

function buildFallbackInsights(
	questionText: string,
	matches: SimilarQuestionMatch[],
	detectedSubject: string,
	topics: string[],
): SimilarQuestionAssistantInsights {
	const subjectTopics = topics.filter(Boolean).slice(0, 4);
	const suggestedQueries = sanitizeSuggestedQueries(
		[
			questionText,
			`${questionText} example`,
			...subjectTopics.map((topic) => `${topic} ${questionText}`),
			`${detectedSubject} ${questionText}`,
		],
		questionText,
		detectedSubject,
		topics,
	);

	return {
		summary:
			matches.length > 0
				? `Found ${matches.length} close match${matches.length === 1 ? "" : "es"} in your question bank. The strongest overlap is around ${subjectTopics[0] || detectedSubject}.`
				: `No close match was found yet. Try the refined searches below to widen the lookup around ${detectedSubject}.`,
		suggestedQueries,
		detectedSubject,
		relatedTopics: subjectTopics,
		model: null,
		fallback: true,
	};
}

function buildSimilarQuestionPrompt(
	questionText: string,
	matches: SimilarQuestionMatch[],
	detectedSubject: string,
	topics: string[],
) {
	return [
		"You help users find related questions in their private question bank.",
		"Return only valid JSON matching the schema.",
		"Write one short summary sentence describing whether the search found strong, partial, or weak matches.",
		"Generate up to four refined follow-up search queries that stay close to the user's intent.",
		"Avoid markdown, numbering, and quotes inside the query strings.",
		`User query: ${questionText}`,
		`Detected subject: ${detectedSubject}`,
		`Related topics: ${topics.filter(Boolean).join(", ") || "None"}`,
		matches.length > 0
			? `Top matches:\n${matches
					.slice(0, 5)
					.map(
						(match, index) =>
							`${index + 1}. ${match.question} | difficulty=${match.difficulty ?? "Unknown"} | score=${match.score.toFixed(2)}`,
					)
					.join("\n")}`
			: "Top matches: none",
	].join("\n");
}

function sanitizeSuggestedQueries(
	candidates: string[],
	questionText: string,
	detectedSubject: string,
	topics: string[],
) {
	const normalizedQuestion = normalizeText(questionText);
	const topicSeed = topics.filter(Boolean).slice(0, 3);
	const defaults = [
		questionText,
		`${detectedSubject} ${questionText}`,
		...topicSeed.map((topic) => `${topic} ${questionText}`),
		`${questionText} example`,
	];

	return [...candidates, ...defaults]
		.map((item) => item.trim().replace(/\s+/g, " "))
		.filter((item) => item.length >= 3)
		.filter(
			(item, index, array) =>
				array.findIndex((other) => normalizeText(other) === normalizeText(item)) === index,
		)
		.filter((item) => normalizeText(item) !== normalizedQuestion || item === questionText)
		.slice(0, 4);
}

function splitIntoSearchTerms(value: string) {
	return normalizeText(value)
		.split(/\s+/)
		.flatMap(expandCompoundToken)
		.map(stemToken)
		.filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function normalizeText(value: string) {
	return value
		.toLowerCase()
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/linked\s*list/g, "linked list")
		.replace(/link\s*list/g, "linked list")
		.replace(/binarytree/g, "binary tree")
		.replace(/hashtable/g, "hash table")
		.replace(/hashmap/g, "hash map")
		.replace(/stackoverflow/g, "stack overflow")
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function expandCompoundToken(token: string) {
	const expanded = new Set([token]);
	for (const pattern of COMPOUND_PATTERNS) {
		if (pattern.matcher.test(token)) {
			for (const part of pattern.parts) expanded.add(part);
		}
	}
	if (token.length >= 8) {
		for (let index = 3; index <= token.length - 3; index += 1) {
			const left = token.slice(0, index);
			const right = token.slice(index);
			if (KNOWN_TERMS.has(left) && KNOWN_TERMS.has(right)) {
				expanded.add(left);
				expanded.add(right);
			}
		}
	}
	return [...expanded];
}

const COMPOUND_PATTERNS = [
	{ matcher: /^linked?list$/, parts: ["linked", "list"] },
	{ matcher: /^arraylist$/, parts: ["array", "list"] },
	{ matcher: /^linkedlist$/, parts: ["linked", "list"] },
	{ matcher: /^doublylinkedlist$/, parts: ["doubly", "linked", "list"] },
	{ matcher: /^singlylinkedlist$/, parts: ["singly", "linked", "list"] },
	{ matcher: /^binarytree$/, parts: ["binary", "tree"] },
	{ matcher: /^hashtable$/, parts: ["hash", "table"] },
	{ matcher: /^hashmap$/, parts: ["hash", "map"] },
] as const;

const KNOWN_TERMS = new Set([
	"array",
	"binary",
	"doubly",
	"graph",
	"hash",
	"linked",
	"list",
	"map",
	"queue",
	"singly",
	"stack",
	"table",
	"tree",
]);

function compactForm(value: string) {
	return normalizeText(value).replace(/\s+/g, "");
}

function hasImportantSubstringMatch(leftTokens: Set<string>, rightTokens: Set<string>) {
	const left = [...leftTokens];
	const right = [...rightTokens];
	return left.some(
		(leftToken) =>
			leftToken.length >= 4 &&
			right.some(
				(rightToken) =>
					rightToken.length >= 4 &&
					(leftToken.includes(rightToken) || rightToken.includes(leftToken)),
			),
	);
}

function keywordCoverage(leftTokens: Set<string>, rightTokens: Set<string>) {
	if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
	const left = [...leftTokens];
	const intersection = left.filter((token) => rightTokens.has(token)).length;
	return intersection / left.length;
}

function jaccardDiceScore(leftTokens: Set<string>, rightTokens: Set<string>) {
	if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
	const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
	return (2 * intersection) / (leftTokens.size + rightTokens.size);
}

function charNgrams(value: string, size: number) {
	const compact = value.replace(/\s+/g, "");
	if (compact.length < size) return new Set(compact ? [compact] : []);
	const grams = new Set<string>();
	for (let index = 0; index <= compact.length - size; index += 1) {
		grams.add(compact.slice(index, index + size));
	}
	return grams;
}

function diceCoefficient(left: Set<string>, right: Set<string>) {
	if (left.size === 0 || right.size === 0) return 0;
	const intersection = [...left].filter((token) => right.has(token)).length;
	return (2 * intersection) / (left.size + right.size);
}

function detectSubjectLocallyFallback(question: string) {
	const normalized = normalizeText(question);
	if (/\b(linked|list|array|stack|queue|tree|graph|hash)\b/.test(normalized)) {
		return {
			primarySubject: "Computer Science",
			topics: ["Data Structures", "Algorithms"],
			subtopics: ["Implementation", "Operations"],
		};
	}
	return {
		primarySubject: "General Knowledge",
		topics: ["General Reasoning"],
		subtopics: [],
	};
}
