import { fetchGroqModels, getGroqModel, isGroqConfigured } from "./groq-client";

const GROQ_HEALTH_TTL_MS = 45_000;

let healthCache: {
	value: boolean;
	expiresAt: number;
} | null = null;
let healthPromise: Promise<boolean> | null = null;

export async function isGroqHealthyCached() {
	if (!isGroqConfigured()) {
		return false;
	}

	const now = Date.now();
	if (healthCache && healthCache.expiresAt > now) {
		return healthCache.value;
	}

	if (!healthPromise) {
		healthPromise = fetchGroqHealth()
			.then((value) => {
				setGroqHealth(value);
				return value;
			})
			.finally(() => {
				healthPromise = null;
			});
	}

	return healthPromise;
}

export function reportGroqHealthSuccess() {
	setGroqHealth(true);
}

export function reportGroqHealthFailure() {
	clearGroqHealthCache();
}

async function fetchGroqHealth() {
	try {
		const configuredModel = getGroqModel().trim().toLowerCase();
		const payload = await fetchGroqModels();
		const availableModels = payload.data ?? [];

		return availableModels.some((model) => model.id?.trim().toLowerCase() === configuredModel);
	} catch {
		return false;
	}
}

function setGroqHealth(value: boolean) {
	healthCache = {
		value,
		expiresAt: Date.now() + GROQ_HEALTH_TTL_MS,
	};
}

function clearGroqHealthCache() {
	healthCache = null;
	healthPromise = null;
}
