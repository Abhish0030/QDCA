import { env } from "../../../config/env";

const OLLAMA_HEALTH_TTL_MS = 45_000;
const OLLAMA_HEALTH_TIMEOUT_MS = 3_000;

let healthCache: {
	value: boolean;
	expiresAt: number;
} | null = null;
let healthPromise: Promise<boolean> | null = null;

export async function isOllamaHealthyCached() {
	if (!env.OLLAMA_BASE_URL) {
		return false;
	}

	const now = Date.now();
	if (healthCache && healthCache.expiresAt > now) {
		return healthCache.value;
	}

	if (!healthPromise) {
		healthPromise = fetchOllamaHealth()
			.then((value) => {
				setOllamaHealth(value);
				return value;
			})
			.finally(() => {
				healthPromise = null;
			});
	}

	return healthPromise;
}

export function reportOllamaHealthSuccess() {
	setOllamaHealth(true);
}

export function reportOllamaHealthFailure() {
	// A model request can fail for reasons other than the Ollama daemon being down
	// (cold model load, request timeout, bad payload, etc.), so avoid poisoning the
	// daemon health cache with a hard false result from request-level failures.
	clearOllamaHealthCache();
}

async function fetchOllamaHealth() {
	try {
		const response = await fetch(`${env.OLLAMA_BASE_URL}/api/version`, {
			signal: AbortSignal.timeout(OLLAMA_HEALTH_TIMEOUT_MS),
		});
		return response.ok;
	} catch {
		return false;
	}
}

function setOllamaHealth(value: boolean) {
	healthCache = {
		value,
		expiresAt: Date.now() + OLLAMA_HEALTH_TTL_MS,
	};
}

function clearOllamaHealthCache() {
	healthCache = null;
	healthPromise = null;
}
