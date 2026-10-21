import { env } from "../../../config/env";
import {
	buildOllamaHeaders,
	generationOptions,
	OLLAMA_REQUEST_TIMEOUT_MS,
	requestOllama,
} from "./ollama-client";

const WARMUP_GENERATE_MODEL = env.OLLAMA_LLAMA_MODEL?.trim();
const WARMUP_EMBEDDING_MODEL = env.OLLAMA_EMBEDDING_MODEL?.trim() || "nomic-embed-text";
const WARMUP_TIMEOUT_MS = Math.max(OLLAMA_REQUEST_TIMEOUT_MS, 45_000);

type OllamaGenerateWarmupResponse = {
	response?: string;
};

type OllamaEmbedWarmupResponse = {
	embeddings?: number[][];
	embedding?: number[];
};

export async function warmOllamaModelsOnStartup() {
	if (!env.OLLAMA_BASE_URL || env.NODE_ENV === "test") {
		return;
	}

	const tasks: Array<Promise<void>> = [];
	const generateModel = await resolveWarmupGenerateModel();

	if (generateModel) {
		tasks.push(warmGenerateModel(generateModel));
	}

	if (WARMUP_EMBEDDING_MODEL) {
		tasks.push(warmEmbeddingModel(WARMUP_EMBEDDING_MODEL));
	}

	const results = await Promise.allSettled(tasks);
	const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");

	if (failures.length > 0) {
		for (const failure of failures) {
			console.warn("[ollama] startup warm-up failed", failure.reason);
		}
		return;
	}

	console.info("[ollama] startup warm-up completed", {
		generateModel: generateModel ?? null,
		embeddingModel: WARMUP_EMBEDDING_MODEL,
	});
}

async function warmGenerateModel(model: string) {
	await requestOllama<OllamaGenerateWarmupResponse>(
		"/api/generate",
		{
			model,
			prompt: "Reply with READY only.",
			stream: false,
			options: generationOptions(0, 8, 7),
			keep_alive: -1,
		},
		WARMUP_TIMEOUT_MS,
	);
}

async function warmEmbeddingModel(model: string) {
	await requestOllama<OllamaEmbedWarmupResponse>(
		"/api/embed",
		{
			model,
			input: "Warm the embedding model.",
			keep_alive: -1,
		},
		WARMUP_TIMEOUT_MS,
	);
}

async function resolveWarmupGenerateModel() {
	if (!WARMUP_GENERATE_MODEL || !env.OLLAMA_BASE_URL) {
		return WARMUP_GENERATE_MODEL;
	}

	try {
		const response = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, {
			headers: buildOllamaHeaders(),
			signal: AbortSignal.timeout(5_000),
		});

		if (!response.ok) {
			return WARMUP_GENERATE_MODEL;
		}

		const payload = (await response.json()) as {
			models?: Array<{ name?: string; model?: string }>;
		};
		const installedModels = (payload.models ?? [])
			.map((item) => item.name ?? item.model ?? "")
			.filter(Boolean);
		const matchedModel = installedModels.find((model) => matchesModelTag(model, WARMUP_GENERATE_MODEL));

		return matchedModel ?? WARMUP_GENERATE_MODEL;
	} catch {
		return WARMUP_GENERATE_MODEL;
	}
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
