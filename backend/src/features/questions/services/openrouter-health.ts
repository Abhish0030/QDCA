import {
	fetchOpenRouterUserModels,
	getOpenRouterGemmaModel,
	getOpenRouterNemotronModel,
	isOpenRouterGemmaConfigured,
	isOpenRouterNemotronConfigured,
} from "./openrouter-client";

// A single failed probe is cached process-wide for this TTL, so one bad check can
// leave the dashboard reporting OpenRouter offline for other users until it expires.
const OPENROUTER_HEALTH_TTL_MS = 45_000;

let healthCache: {
	value: boolean;
	expiresAt: number;
} | null = null;
let healthPromise: Promise<boolean> | null = null;
let gemmaHealthCache: {
	value: boolean;
	expiresAt: number;
} | null = null;
let gemmaHealthPromise: Promise<boolean> | null = null;

export async function isOpenRouterHealthyCached() {
	if (!isOpenRouterNemotronConfigured()) {
		return false;
	}

	const now = Date.now();
	if (healthCache && healthCache.expiresAt > now) {
		return healthCache.value;
	}

	if (!healthPromise) {
		healthPromise = fetchOpenRouterHealth()
			.then((value) => {
				setOpenRouterHealth(value);
				return value;
			})
			.finally(() => {
				healthPromise = null;
			});
	}

	return healthPromise;
}

export function reportOpenRouterHealthSuccess() {
	setOpenRouterHealth(true);
}

export function reportOpenRouterHealthFailure() {
	clearOpenRouterHealthCache();
}

export async function isOpenRouterGemmaHealthyCached() {
	if (!isOpenRouterGemmaConfigured()) {
		return false;
	}

	const now = Date.now();
	if (gemmaHealthCache && gemmaHealthCache.expiresAt > now) {
		return gemmaHealthCache.value;
	}

	if (!gemmaHealthPromise) {
		gemmaHealthPromise = fetchOpenRouterGemmaHealth()
			.then((value) => {
				setOpenRouterGemmaHealth(value);
				return value;
			})
			.finally(() => {
				gemmaHealthPromise = null;
			});
	}

	return gemmaHealthPromise;
}

export function reportOpenRouterGemmaHealthSuccess() {
	setOpenRouterGemmaHealth(true);
}

export function reportOpenRouterGemmaHealthFailure() {
	clearOpenRouterGemmaHealthCache();
}

async function fetchOpenRouterHealth() {
	return fetchOpenRouterModelHealth(getOpenRouterNemotronModel());
}

async function fetchOpenRouterGemmaHealth() {
	return fetchOpenRouterModelHealth(getOpenRouterGemmaModel(), process.env.OPENROUTER_GEMMA_API_KEY);
}

async function fetchOpenRouterModelHealth(configuredModel: string, apiKey?: string) {
	const startedAt = Date.now();
	try {
		const normalizedConfiguredModel = configuredModel.trim().toLowerCase();
		const payload = await fetchOpenRouterUserModels(12_000, apiKey);
		const availableModels = payload.data ?? [];
		const isAvailable = availableModels.some((model) => {
			const identifiers = [model.id, model.canonical_slug]
				.map((value) => value?.trim().toLowerCase())
				.filter(Boolean);
			return identifiers.includes(normalizedConfiguredModel);
		});

		if (!isAvailable) {
			console.error("[openrouter-health] configured model not found in /models/user", {
				model: configuredModel,
				elapsedMs: Date.now() - startedAt,
				sampleCount: availableModels.length,
			});
		}

		return isAvailable;
	} catch (error) {
		const elapsedMs = Date.now() - startedAt;
		const message = error instanceof Error ? error.message : String(error);
		const timeoutMessage = message.toLowerCase();
		const statusMatch = message.match(/\bstatus\s+(\d{3})\b/i);
		const statusCode = statusMatch ? Number(statusMatch[1]) : null;
		const reason = timeoutMessage.includes("timed out")
			? "timeout"
			: statusCode
				? "http_error"
				: "network_or_unknown";

		console.error("[openrouter-health] model availability check failed", {
			model: configuredModel,
			elapsedMs,
			reason,
			statusCode,
			message,
		});

		return false;
	}
}

function setOpenRouterHealth(value: boolean) {
	healthCache = {
		value,
		expiresAt: Date.now() + OPENROUTER_HEALTH_TTL_MS,
	};
}

function clearOpenRouterHealthCache() {
	healthCache = null;
	healthPromise = null;
}

function setOpenRouterGemmaHealth(value: boolean) {
	gemmaHealthCache = {
		value,
		expiresAt: Date.now() + OPENROUTER_HEALTH_TTL_MS,
	};
}

function clearOpenRouterGemmaHealthCache() {
	gemmaHealthCache = null;
	gemmaHealthPromise = null;
}
