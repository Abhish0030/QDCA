import { env } from "../../../config/env";

const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
const DEFAULT_TIMEOUT_MS = 45_000;
const GROQ_BASE_URL = env.GROQ_BASE_URL?.trim() || DEFAULT_GROQ_BASE_URL;
const GROQ_MODEL = DEFAULT_GROQ_MODEL;

interface GroqMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

interface GroqErrorPayload {
	error?: {
		message?: string;
		type?: string;
		code?: string | number | null;
	};
}

interface GroqChatResponse extends GroqErrorPayload {
	model?: string;
	choices?: Array<{
		message?: {
			content?: string | Array<{ type?: string; text?: string }> | null;
		};
	}>;
}

export function getGroqBaseUrl() {
	return GROQ_BASE_URL;
}

export function getGroqModel() {
	return GROQ_MODEL;
}

export function isGroqConfigured() {
	return Boolean(env.GROQ_API_KEY?.trim());
}

export async function requestGroqText(input: {
	model?: string;
	systemPrompt?: string;
	userPrompt: string;
	temperature?: number;
	maxCompletionTokens?: number;
	topP?: number;
	reasoningEffort?: "low" | "medium" | "high";
	timeoutMs?: number;
}) {
	const payload = await requestGroq<GroqChatResponse>(
		"/chat/completions",
		{
			model: input.model ?? GROQ_MODEL,
			messages: buildMessages(input.systemPrompt, input.userPrompt),
			temperature: input.temperature ?? 1,
			max_completion_tokens: input.maxCompletionTokens ?? 2048,
			top_p: input.topP ?? 1,
			reasoning_effort: input.reasoningEffort ?? "medium",
			stream: false,
			user: "qdca-server",
		},
		input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
	);
	const text = readMessageContent(payload.choices?.[0]?.message?.content);

	if (!text) {
		throw new Error("Groq returned an empty response.");
	}

	return {
		text,
		model: payload.model ?? input.model ?? GROQ_MODEL,
	};
}

export async function requestGroqTextStream(input: {
	model?: string;
	systemPrompt?: string;
	userPrompt: string;
	temperature?: number;
	maxCompletionTokens?: number;
	topP?: number;
	reasoningEffort?: "low" | "medium" | "high";
	timeoutMs?: number;
	onChunk: (chunk: string) => void;
}) {
	const controller = new AbortController();
	const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
			method: "POST",
			headers: buildHeaders(),
			signal: controller.signal,
			body: JSON.stringify({
				model: input.model ?? GROQ_MODEL,
				messages: buildMessages(input.systemPrompt, input.userPrompt),
				temperature: input.temperature ?? 1,
				max_completion_tokens: input.maxCompletionTokens ?? 2048,
				top_p: input.topP ?? 1,
				reasoning_effort: input.reasoningEffort ?? "medium",
				stream: true,
				user: "qdca-server",
			}),
		});

		if (!response.ok) {
			throw await buildGroqError(response, "/chat/completions");
		}

		if (!response.body) {
			throw new Error("Groq stream response body was empty.");
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let pending = "";
		let combined = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			pending += decoder.decode(value, { stream: true });
			const events = pending.split("\n\n");
			pending = events.pop() ?? "";

			for (const event of events) {
				const parsed = parseSseData(event);
				if (!parsed || parsed === "[DONE]") continue;

				const payload = JSON.parse(parsed) as {
					error?: { message?: string };
					choices?: Array<{
						delta?: {
							content?: string | Array<{ type?: string; text?: string }> | null;
						};
					}>;
				};

				if (payload.error?.message) {
					throw new Error(payload.error.message);
				}

				const chunk = readMessageContent(payload.choices?.[0]?.delta?.content);
				if (chunk) {
					combined += chunk;
					input.onChunk(chunk);
				}
			}
		}

		if (pending.trim()) {
			const parsed = parseSseData(pending);
			if (parsed && parsed !== "[DONE]") {
				const payload = JSON.parse(parsed) as {
					choices?: Array<{
						delta?: {
							content?: string | Array<{ type?: string; text?: string }> | null;
						};
					}>;
				};
				const chunk = readMessageContent(payload.choices?.[0]?.delta?.content);
				if (chunk) {
					combined += chunk;
					input.onChunk(chunk);
				}
			}
		}

		if (!combined.trim()) {
			throw new Error("Groq returned an empty streamed response.");
		}

		return {
			text: combined.trim(),
			model: input.model ?? GROQ_MODEL,
		};
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`Groq request timed out after ${timeoutMs}ms`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

export async function fetchGroqModels(timeoutMs = 12_000) {
	if (!isGroqConfigured()) {
		throw new Error("Groq is not configured. Set GROQ_API_KEY to enable the Groq hosted model.");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${GROQ_BASE_URL}/models`, {
			method: "GET",
			headers: buildHeaders(),
			signal: controller.signal,
		});

		if (!response.ok) {
			throw await buildGroqError(response, "/models");
		}

		return (await response.json()) as {
			data?: Array<{ id?: string }>;
		};
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`Groq models check timed out after ${timeoutMs}ms`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function requestGroq<T>(path: "/chat/completions", body: Record<string, unknown>, timeoutMs: number) {
	if (!isGroqConfigured()) {
		throw new Error("Groq is not configured. Set GROQ_API_KEY to enable the Groq hosted model.");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${GROQ_BASE_URL}${path}`, {
			method: "POST",
			headers: buildHeaders(),
			signal: controller.signal,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw await buildGroqError(response, path);
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`Groq ${path} request timed out after ${timeoutMs}ms`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function buildGroqError(response: Response, path: string) {
	const retryAfter = Number(response.headers.get("retry-after"));
	const remainingRequests = response.headers.get("x-ratelimit-remaining-requests");
	const remainingTokens = response.headers.get("x-ratelimit-remaining-tokens");
	const details = (await response.json().catch(() => null)) as GroqErrorPayload | null;
	const message = details?.error?.message?.trim() || `Groq ${path} request failed`;

	if (response.status === 429) {
		const retryMessage =
			Number.isFinite(retryAfter) && retryAfter > 0
				? ` Retry after ${retryAfter} seconds.`
				: "";
		const requestsMessage =
			typeof remainingRequests === "string" && remainingRequests.length > 0
				? ` Remaining requests: ${remainingRequests}.`
				: "";
		const tokensMessage =
			typeof remainingTokens === "string" && remainingTokens.length > 0
				? ` Remaining tokens: ${remainingTokens}.`
				: "";
		return new Error(`Groq rate limit exceeded.${retryMessage}${requestsMessage}${tokensMessage} ${message}`.trim());
	}

	if (response.status === 503) {
		return new Error(`Groq is temporarily unavailable. ${message}`);
	}

	if (response.status === 401 || response.status === 403) {
		return new Error(`Groq authentication failed. ${message}`);
	}

	return new Error(`Groq ${path} request failed with status ${response.status}: ${message}`);
}

function buildMessages(systemPrompt: string | undefined, userPrompt: string): GroqMessage[] {
	return [
		...(systemPrompt?.trim()
			? [
					{
						role: "system" as const,
						content: systemPrompt.trim(),
					},
				]
			: []),
		{
			role: "user" as const,
			content: userPrompt,
		},
	];
}

function buildHeaders() {
	return {
		Authorization: `Bearer ${env.GROQ_API_KEY?.trim() || ""}`,
		"Content-Type": "application/json",
	};
}

function parseSseData(event: string) {
	const lines = event
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => !line.startsWith(":"));
	const dataLines = lines.filter((line) => line.startsWith("data:"));
	if (dataLines.length === 0) {
		return "";
	}
	return dataLines.map((line) => line.slice(5).trim()).join("\n");
}

function readMessageContent(
	value: string | Array<{ type?: string; text?: string }> | null | undefined,
) {
	if (typeof value === "string") {
		return value.trim();
	}

	if (Array.isArray(value)) {
		return value
			.map((part) => (typeof part?.text === "string" ? part.text : ""))
			.join("")
			.trim();
	}

	return "";
}
