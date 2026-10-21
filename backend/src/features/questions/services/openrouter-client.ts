import { env } from "../../../config/env";

const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_TIMEOUT_MS = 45_000;
const OPENROUTER_BASE_URL = env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL;
const OPENROUTER_NEMOTRON_MODEL =
	env.OPENROUTER_NEMOTRON_MODEL?.trim() || "tencent/hy3:free";
const OPENROUTER_GEMMA_MODEL = "google/gemma-4-26b-a4b-it:free";

interface OpenRouterMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

interface OpenRouterErrorPayload {
	error?: {
		code?: number;
		message?: string;
		metadata?: Record<string, unknown>;
	};
}

interface OpenRouterChatResponse extends OpenRouterErrorPayload {
	id?: string;
	model?: string;
	choices?: Array<{
		message?: {
			content?: string | null;
		};
	}>;
}

export function getOpenRouterBaseUrl() {
	return OPENROUTER_BASE_URL;
}

export function getOpenRouterNemotronModel() {
	return OPENROUTER_NEMOTRON_MODEL;
}

export function getOpenRouterGemmaModel() {
	return OPENROUTER_GEMMA_MODEL;
}

export function getOpenRouterConfiguredModelLabel() {
	switch (OPENROUTER_NEMOTRON_MODEL) {
		case "tencent/hy3:free":
			return "Tencent HY3";
		case "meta-llama/llama-3.3-70b-instruct:free":
			return "Llama 3.3 70B Instruct";
		case "meta-llama/llama-3.2-3b-instruct:free":
			return "Llama 3.2 3B Instruct";
		case "qwen/qwen3-coder:free":
			return "Qwen3 Coder";
		case "qwen/qwen3-next-80b-a3b-instruct:free":
			return "Qwen3 Next 80B A3B";
		default:
			return "OpenRouter Hosted Model";
	}
}

export function isOpenRouterNemotronConfigured() {
	return Boolean(env.OPENROUTER_API_KEY?.trim());
}

export function isOpenRouterGemmaConfigured() {
	return Boolean(env.OPENROUTER_GEMMA_API_KEY?.trim());
}

export async function requestOpenRouterText(input: {
	model?: string;
	systemPrompt?: string;
	userPrompt: string;
	temperature?: number;
	maxTokens?: number;
	timeoutMs?: number;
	apiKey?: string;
}) {
	const payload = await requestOpenRouter<OpenRouterChatResponse>(
		"/chat/completions",
		{
			model: input.model ?? OPENROUTER_NEMOTRON_MODEL,
			messages: buildMessages(input.systemPrompt, input.userPrompt),
			temperature: input.temperature ?? 0.2,
			max_tokens: input.maxTokens ?? 512,
			stream: false,
			user: "qdca-server",
		},
		input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
		input.apiKey,
	);
	const text = payload.choices?.[0]?.message?.content?.trim();

	if (!text) {
		throw new Error("OpenRouter returned an empty response.");
	}

	return {
		text,
		model: payload.model ?? input.model ?? OPENROUTER_NEMOTRON_MODEL,
	};
}

export async function requestOpenRouterTextStream(input: {
	model?: string;
	systemPrompt?: string;
	userPrompt: string;
	temperature?: number;
	maxTokens?: number;
	timeoutMs?: number;
	onChunk: (chunk: string) => void;
	apiKey?: string;
}) {
	const controller = new AbortController();
	const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
			method: "POST",
			headers: buildHeaders(input.apiKey),
			signal: controller.signal,
			body: JSON.stringify({
				model: input.model ?? OPENROUTER_NEMOTRON_MODEL,
				messages: buildMessages(input.systemPrompt, input.userPrompt),
				temperature: input.temperature ?? 0.2,
				max_tokens: input.maxTokens ?? 512,
				stream: true,
				user: "qdca-server",
			}),
		});

		if (!response.ok) {
			throw await buildOpenRouterError(response, "/chat/completions");
		}

		if (!response.body) {
			throw new Error("OpenRouter stream response body was empty.");
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
				if (!parsed) continue;
				if (parsed === "[DONE]") continue;

				const payload = JSON.parse(parsed) as {
					error?: { message?: string };
					choices?: Array<{ delta?: { content?: string | null } }>;
				};

				if (payload.error?.message) {
					throw new Error(payload.error.message);
				}

				const chunk = payload.choices?.[0]?.delta?.content;
				if (typeof chunk === "string" && chunk) {
					combined += chunk;
					input.onChunk(chunk);
				}
			}
		}

		if (pending.trim()) {
			const parsed = parseSseData(pending);
			if (parsed && parsed !== "[DONE]") {
				const payload = JSON.parse(parsed) as {
					choices?: Array<{ delta?: { content?: string | null } }>;
				};
				const chunk = payload.choices?.[0]?.delta?.content;
				if (typeof chunk === "string" && chunk) {
					combined += chunk;
					input.onChunk(chunk);
				}
			}
		}

		if (!combined.trim()) {
			throw new Error("OpenRouter returned an empty streamed response.");
		}

		return {
			text: combined.trim(),
			model: input.model ?? OPENROUTER_NEMOTRON_MODEL,
		};
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`OpenRouter request timed out after ${timeoutMs}ms`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

export async function fetchOpenRouterKeyInfo(timeoutMs = 8_000, apiKey?: string) {
	if (!resolveOpenRouterApiKey(apiKey)) {
		throw new Error("OpenRouter is not configured. Set OPENROUTER_API_KEY to enable the hosted OpenRouter fallback model.");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${OPENROUTER_BASE_URL}/key`, {
			method: "GET",
			headers: buildHeaders(apiKey),
			signal: controller.signal,
		});

		if (!response.ok) {
			throw await buildOpenRouterError(response, "/key");
		}

		return (await response.json()) as {
			data?: {
				limit_remaining?: number | null;
				is_free_tier?: boolean;
			};
		};
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`OpenRouter key check timed out after ${timeoutMs}ms`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

export async function fetchOpenRouterUserModels(timeoutMs = 12_000, apiKey?: string) {
	if (!resolveOpenRouterApiKey(apiKey)) {
		throw new Error("OpenRouter is not configured. Set OPENROUTER_API_KEY to enable the hosted OpenRouter fallback model.");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${OPENROUTER_BASE_URL}/models/user`, {
			method: "GET",
			headers: buildHeaders(apiKey),
			signal: controller.signal,
		});

		if (!response.ok) {
			throw await buildOpenRouterError(response, "/models/user");
		}

		return (await response.json()) as {
			data?: Array<{ id?: string; canonical_slug?: string }>;
		};
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`OpenRouter models check timed out after ${timeoutMs}ms`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function requestOpenRouter<T>(
	path: "/chat/completions",
	body: Record<string, unknown>,
	timeoutMs: number,
	apiKey?: string,
) {
	if (!resolveOpenRouterApiKey(apiKey)) {
		throw new Error("OpenRouter is not configured. Set OPENROUTER_API_KEY to enable the hosted OpenRouter fallback model.");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${OPENROUTER_BASE_URL}${path}`, {
			method: "POST",
			headers: buildHeaders(apiKey),
			signal: controller.signal,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw await buildOpenRouterError(response, path);
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`OpenRouter ${path} request timed out after ${timeoutMs}ms`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function buildOpenRouterError(response: Response, path: string) {
	const retryAfter = Number(response.headers.get("Retry-After"));
	const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
	const details = (await response.json().catch(() => null)) as OpenRouterErrorPayload | null;
	const message = details?.error?.message?.trim() || `OpenRouter ${path} request failed`;
	const errorType = readMetadataString(details?.error?.metadata, "error_type");

	if (response.status === 429) {
		const retryMessage =
			Number.isFinite(retryAfter) && retryAfter > 0
				? ` Retry after ${retryAfter} seconds.`
				: "";
		const remainingMessage =
			typeof rateLimitRemaining === "string" && rateLimitRemaining.length > 0
				? ` Remaining quota header: ${rateLimitRemaining}.`
				: "";
		return new Error(`OpenRouter rate limit exceeded.${retryMessage}${remainingMessage} ${message}`.trim());
	}

	if (response.status === 503 && errorType === "provider_overloaded") {
		return new Error(`OpenRouter provider is temporarily overloaded. ${message}`);
	}

	if (response.status === 402) {
		return new Error(`OpenRouter credits are unavailable for this key. ${message}`);
	}

	return new Error(`OpenRouter ${path} request failed with status ${response.status}: ${message}`);
}

function buildMessages(systemPrompt: string | undefined, userPrompt: string): OpenRouterMessage[] {
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

function buildHeaders(apiKey?: string) {
	const resolvedApiKey = resolveOpenRouterApiKey(apiKey);
	return {
		Authorization: `Bearer ${resolvedApiKey}`,
		"Content-Type": "application/json",
		"HTTP-Referer": env.FRONTEND_URL,
		"X-OpenRouter-Title": "QDCA",
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

function resolveOpenRouterApiKey(apiKey?: string) {
	return apiKey?.trim() || env.OPENROUTER_API_KEY?.trim() || "";
}

function readMetadataString(
	value: Record<string, unknown> | undefined,
	key: string,
) {
	const metadataValue = value?.[key];
	return typeof metadataValue === "string" ? metadataValue : "";
}
