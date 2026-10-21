import { env } from "../../../config/env";
import { prisma } from "../../../database";
import { AppError } from "../../../shared/utils/app-error";
import {
	getGroqModel,
	isGroqConfigured,
	requestGroqText,
} from "../../questions/services/groq-client";
import { generationOptions, requestOllama } from "../../questions/services/ollama-client";
import {
	isOllamaHealthyCached,
	reportOllamaHealthFailure,
	reportOllamaHealthSuccess,
} from "../../questions/services/ollama-health";
import {
	isGroqHealthyCached,
	reportGroqHealthFailure,
	reportGroqHealthSuccess,
} from "../../questions/services/groq-health";

export interface ChatbotMessage {
	role: "user" | "assistant";
	content: string;
}

export interface ChatbotResponse {
	reply: string;
	model: string;
	provider: "ollama" | "groq";
	fallback: boolean;
	grounded: boolean;
}

interface ChatbotProjectContext {
	totalQuestions: number;
	difficulty: {
		veryEasy: number;
		easy: number;
		medium: number;
		hard: number;
		expert: number;
	};
	recentQuestions: Array<{
		title: string;
		difficulty: string | null;
		createdAt: Date;
	}>;
}

const PRIMARY_MODEL = env.OLLAMA_FAST_MODEL?.trim() || "gemma3:1b";
const FALLBACK_MODEL = env.OLLAMA_FALLBACK_MODEL?.trim() || "llama3.2";
const GROQ_MODEL = getGroqModel();
const CHAT_TIMEOUT_MS = readBoundedNumber(env.OLLAMA_CHAT_TIMEOUT_MS, 22_000, 5_000, 90_000);
const CHAT_NUM_PREDICT = readBoundedNumber(env.OLLAMA_CHAT_NUM_PREDICT, 180, 64, 512);
const CHAT_MESSAGE_LIMIT = readBoundedNumber(env.OLLAMA_CHAT_MESSAGE_LIMIT, 6, 2, 12);
const CHAT_CONTEXT_CACHE_TTL_MS = readBoundedNumber(
	env.OLLAMA_CHAT_CONTEXT_CACHE_TTL_MS,
	15_000,
	0,
	300_000,
);
const CHAT_TEMPERATURE = readBoundedNumber(env.OLLAMA_CHAT_TEMPERATURE_X100, 20, 0, 100) / 100;

const cachedProjectContexts = new Map<
	string,
	{
		value: ChatbotProjectContext | null;
		expiresAt: number;
	}
>();
const projectContextPromises = new Map<string, Promise<ChatbotProjectContext | null>>();

export async function generateChatbotReply(
	messages: ChatbotMessage[],
	userId: string,
): Promise<ChatbotResponse> {
	const sanitizedMessages = sanitizeChatbotMessages(messages);

	if (sanitizedMessages.length === 0) {
		throw new AppError("At least one chat message is required", 400);
	}

	const projectContext = await getProjectContextCached(userId);
	const systemPrompt = buildSystemPrompt(projectContext);
	const ollamaModels = Array.from(new Set([PRIMARY_MODEL, FALLBACK_MODEL]));
	let lastError: unknown;

	for (const [index, model] of ollamaModels.entries()) {
		if (!(await isOllamaHealthyCached())) {
			lastError = new Error("Ollama health check is currently failing");
			break;
		}

		try {
			const reply = await chatWithOllama(model, systemPrompt, sanitizedMessages);

			reportOllamaHealthSuccess();
			return { reply, model, provider: "ollama", fallback: index > 0, grounded: true };
		} catch (error) {
			reportOllamaHealthFailure();
			lastError = error;
		}
	}

	const prompt = buildGeneratePrompt(systemPrompt, sanitizedMessages);

	for (const [index, model] of ollamaModels.entries()) {
		if (!(await isOllamaHealthyCached())) {
			lastError = new Error("Ollama health check is currently failing");
			break;
		}

		try {
			const reply = await generateWithOllama(model, prompt);

			reportOllamaHealthSuccess();
			return { reply, model, provider: "ollama", fallback: index > 0, grounded: true };
		} catch (error) {
			reportOllamaHealthFailure();
			lastError = error;
		}
	}

	if (isGroqConfigured() && (await isGroqHealthyCached())) {
		try {
			const reply = await generateWithGroq(prompt);
			reportGroqHealthSuccess();
			return {
				reply,
				model: GROQ_MODEL,
				provider: "groq",
				fallback: true,
				grounded: true,
			};
		} catch (error) {
			reportGroqHealthFailure();
			lastError = error;
		}
	}

	throw new AppError(
		`Unable to generate chatbot reply with configured AI routes ${[
			...ollamaModels,
			...(isGroqConfigured() ? [GROQ_MODEL] : []),
		].join(", ")}: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
		502,
	);
}

async function chatWithOllama(model: string, systemPrompt: string, messages: ChatbotMessage[]) {
	const payload = await requestOllama<{ message?: { content?: string } }>(
		"/api/chat",
		{
			model,
			stream: false,
			options: generationOptions(CHAT_TEMPERATURE, CHAT_NUM_PREDICT),
			messages: [
				{ role: "system", content: systemPrompt },
				...messages.map((message) => ({ role: message.role, content: message.content })),
			],
		},
		CHAT_TIMEOUT_MS,
	);
	const reply = cleanReply(payload.message?.content ?? "");

	if (!reply) {
		throw new Error("Ollama chat returned an empty response");
	}

	return reply;
}

async function generateWithOllama(model: string, prompt: string) {
	const payload = await requestOllama<{ response?: string }>(
		"/api/generate",
		{
			model,
			prompt,
			stream: false,
			options: generationOptions(CHAT_TEMPERATURE, CHAT_NUM_PREDICT),
		},
		CHAT_TIMEOUT_MS,
	);
	const reply = cleanReply(payload.response ?? "");

	if (!reply) {
		throw new Error("Ollama returned an empty response");
	}

	return reply;
}

async function generateWithGroq(prompt: string) {
	const payload = await requestGroqText({
		model: GROQ_MODEL,
		userPrompt: prompt,
		temperature: 1,
		maxCompletionTokens: 2048,
		topP: 1,
		reasoningEffort: "medium",
		timeoutMs: CHAT_TIMEOUT_MS,
	});
	const reply = cleanReply(payload.text);

	if (!reply) {
		throw new Error("Groq returned an empty response");
	}

	return reply;
}

async function getProjectContextCached(userId: string): Promise<ChatbotProjectContext | null> {
	const cachedProjectContext = cachedProjectContexts.get(userId);
	if (
		CHAT_CONTEXT_CACHE_TTL_MS > 0 &&
		cachedProjectContext &&
		cachedProjectContext.expiresAt > Date.now()
	) {
		return cachedProjectContext.value;
	}

	const projectContextPromise = projectContextPromises.get(userId);
	if (projectContextPromise) {
		return projectContextPromise;
	}

	const nextPromise = getProjectContext(userId)
		.then((value) => {
			if (CHAT_CONTEXT_CACHE_TTL_MS > 0) {
				cachedProjectContexts.set(userId, {
					value,
					expiresAt: Date.now() + CHAT_CONTEXT_CACHE_TTL_MS,
				});
			}
			return value;
		})
		.finally(() => {
			projectContextPromises.delete(userId);
		});

	projectContextPromises.set(userId, nextPromise);
	return nextPromise;
}

async function getProjectContext(userId: string): Promise<ChatbotProjectContext | null> {
	try {
		const [totalQuestions, difficultyCounts, recentQuestions] = await Promise.all([
			prisma.question.count({ where: { createdById: userId } }),
			prisma.question.groupBy({
				where: { createdById: userId },
				by: ["difficulty"],
				_count: { _all: true },
			}),
			prisma.question.findMany({
				where: { createdById: userId },
				orderBy: { createdAt: "desc" },
				take: 5,
				select: {
					title: true,
					difficulty: true,
					createdAt: true,
				},
			}),
		]);

		const difficultyMap = new Map(
			difficultyCounts.map((item) => [item.difficulty, item._count._all]),
		);

		return {
			totalQuestions,
			difficulty: {
				veryEasy: difficultyMap.get("very_easy") ?? 0,
				easy: difficultyMap.get("easy") ?? 0,
				medium: difficultyMap.get("medium") ?? 0,
				hard: difficultyMap.get("hard") ?? 0,
				expert: difficultyMap.get("expert") ?? 0,
			},
			recentQuestions,
		};
	} catch {
		return null;
	}
}

export function buildSystemPrompt(context: ChatbotProjectContext | null) {
	const liveContext = context
		? [
				"Live dashboard data:",
				`- Total questions: ${context.totalQuestions}`,
				`- Your difficulty distribution: Very Easy ${context.difficulty.veryEasy}, Easy ${context.difficulty.easy}, Medium ${context.difficulty.medium}, Hard ${context.difficulty.hard}, Expert ${context.difficulty.expert}`,
				context.recentQuestions.length > 0
					? `- Your recent questions: ${context.recentQuestions.map((item) => `${item.title} (${item.difficulty ?? "unclassified"})`).join("; ")}`
					: "- Your recent questions: none",
			]
		: ["Live dashboard data is currently unavailable. Do not invent counts."];

	return [
		"You are QDCA Assistant, an in-app chatbot for the Question Difficulty Classification Agent dashboard.",
		"Help users understand and use this project professionally.",
		"Project context:",
		"- QDCA classifies questions on five levels: Very Easy (basic recall), Easy (direct application), Medium (moderate conceptual thinking), Hard (multi-step analysis), and Expert (advanced or research-level reasoning).",
		"- The dashboard shows each user's classifications, difficulty distribution, recent activity, and LLM status.",
		"- Users can classify any question from any subject or domain, not only school subjects.",
		"- Subject/domain detection is automatic and may identify topics, related domains, and subtopics.",
		"- PDF upload, extraction, OCR fallback, and RAG indexing are available in the backend.",
		"- Real user dashboard menu items are Dashboard, Classify Question, Doc Analyzer, Question History, Analytics, Similar Questions, Study Roadmap, Settings, and Help & Support.",
		"- If the user asks for model or server problems, mention checking the backend, Ollama, and the local model.",
		...liveContext,
		"Answer style:",
		"- Be concise, practical, and product-aware.",
		"- Use live dashboard data when relevant.",
		"- Do not invent dashboard data or pretend actions were completed.",
		"- Do not mention menu items, buttons, or routes unless they exist in the project context above.",
		"- If asked to classify a question, use exactly one of the five QDCA levels, give a short reason based on cognitive depth, and suggest using the Classify Question page for saved analysis.",
		"- If asked about app navigation, guide them to the relevant dashboard menu item.",
	].join("\n");
}

function buildGeneratePrompt(systemPrompt: string, messages: ChatbotMessage[]) {
	const conversation = messages
		.map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
		.join("\n");

	return [systemPrompt, "Conversation:", conversation, "Assistant:"].join("\n");
}

export function sanitizeChatbotMessages(messages: ChatbotMessage[]) {
	return messages
		.map((message) => ({
			role: message.role,
			content: message.content.trim(),
		}))
		.filter((message) => message.content.length > 0)
		.slice(-CHAT_MESSAGE_LIMIT);
}

export function cleanReply(reply: string) {
	return reply
		.replace(/^Assistant:\s*/i, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim()
		.slice(0, 1600);
}

function readBoundedNumber(
	value: number | undefined,
	fallback: number,
	minimum: number,
	maximum: number,
) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}
