import { env } from "../../../config/env";

const OLLAMA_BASE_URL = env.OLLAMA_BASE_URL;
const OLLAMA_API_KEY = env.OLLAMA_API_KEY?.trim();

export const OLLAMA_NUM_CTX = readBoundedNumber(env.OLLAMA_NUM_CTX, 2048, 512, 8192);
export const OLLAMA_REQUEST_TIMEOUT_MS = readBoundedNumber(
	env.OLLAMA_REQUEST_TIMEOUT_MS,
	30_000,
	5_000,
	120_000,
);
export const OLLAMA_KEEP_ALIVE = env.OLLAMA_KEEP_ALIVE?.trim() || "15m";
export const OLLAMA_NEMOTRON_KEEP_ALIVE = env.OLLAMA_NEMOTRON_KEEP_ALIVE?.trim() || "0";

export function generationOptions(temperature: number, numPredict: number, seed?: number) {
	return {
		temperature,
		num_ctx: OLLAMA_NUM_CTX,
		num_predict: numPredict,
		...(seed === undefined ? {} : { seed }),
	};
}

export async function requestOllama<T>(
	path: "/api/generate" | "/api/chat" | "/api/embed" | "/api/embeddings",
	body: Record<string, unknown>,
	timeoutMs = OLLAMA_REQUEST_TIMEOUT_MS,
): Promise<T> {
	if (!OLLAMA_BASE_URL) {
		throw new Error("Ollama is not configured. Set OLLAMA_BASE_URL to enable local model routes.");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const startedAt = performance.now();
	const model = typeof body.model === "string" ? body.model : "unknown";
	const keepAlive = resolveKeepAlive(model, body.keep_alive);

	try {
		const response = await fetch(`${OLLAMA_BASE_URL}${path}`, {
			method: "POST",
			headers: buildOllamaHeaders(),
			signal: controller.signal,
			body: JSON.stringify({
				...body,
				keep_alive: keepAlive,
			}),
		});

		if (!response.ok) {
			const details = await response.text().catch(() => "");
			throw new Error(
				`Ollama ${path} request failed with status ${response.status}${details ? ` - ${details}` : ""}`,
			);
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`Ollama ${path} request timed out after ${timeoutMs}ms`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
		console.info("[ollama] request completed", {
			path,
			model,
			durationMs: Math.round(performance.now() - startedAt),
		});
	}
}

export async function requestOllamaStream(
	path: "/api/generate",
	body: Record<string, unknown>,
	onChunk: (chunk: string) => void,
	timeoutMs = OLLAMA_REQUEST_TIMEOUT_MS,
) {
	if (!OLLAMA_BASE_URL) {
		throw new Error("Ollama is not configured. Set OLLAMA_BASE_URL to enable local model routes.");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const startedAt = performance.now();
	const model = typeof body.model === "string" ? body.model : "unknown";
	const keepAlive = resolveKeepAlive(model, body.keep_alive);

	try {
		const response = await fetch(`${OLLAMA_BASE_URL}${path}`, {
			method: "POST",
			headers: buildOllamaHeaders(),
			signal: controller.signal,
			body: JSON.stringify({
				...body,
				stream: true,
				keep_alive: keepAlive,
			}),
		});

		if (!response.ok) {
			const details = await response.text().catch(() => "");
			throw new Error(
				`Ollama ${path} request failed with status ${response.status}${details ? ` - ${details}` : ""}`,
			);
		}

		if (!response.body) {
			throw new Error("Ollama stream response body was empty");
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let pending = "";
		let combined = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			pending += decoder.decode(value, { stream: true });
			const lines = pending.split("\n");
			pending = lines.pop() ?? "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) continue;
				const payload = JSON.parse(trimmed) as { response?: string; error?: string };
				if (payload.error) {
					throw new Error(payload.error);
				}
				if (payload.response) {
					combined += payload.response;
					onChunk(payload.response);
				}
			}
		}

		if (pending.trim()) {
			const payload = JSON.parse(pending.trim()) as { response?: string; error?: string };
			if (payload.error) {
				throw new Error(payload.error);
			}
			if (payload.response) {
				combined += payload.response;
				onChunk(payload.response);
			}
		}

		return combined;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(`Ollama ${path} request timed out after ${timeoutMs}ms`);
		}

		throw error;
	} finally {
		clearTimeout(timeoutId);
		console.info("[ollama] stream request completed", {
			path,
			model,
			durationMs: Math.round(performance.now() - startedAt),
		});
	}
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

function resolveKeepAlive(model: string, override: unknown) {
	if (override !== undefined) {
		return normalizeKeepAliveValue(override);
	}

	const configured = model.toLowerCase().startsWith("nemotron")
		? OLLAMA_NEMOTRON_KEEP_ALIVE
		: OLLAMA_KEEP_ALIVE;

	return normalizeKeepAliveValue(configured);
}

export function buildOllamaHeaders() {
	return {
		"Content-Type": "application/json",
		...(OLLAMA_API_KEY ? { "X-API-Key": OLLAMA_API_KEY } : {}),
	};
}

function normalizeKeepAliveValue(value: unknown) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value !== "string") {
		return value;
	}

	const trimmed = value.trim();
	if (trimmed === "-1") {
		return -1;
	}

	return trimmed;
}
