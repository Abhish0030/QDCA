interface PerfStep {
	end: (details?: Record<string, unknown>) => void;
}

type PerfMetricContextValue = string | number | boolean | null;

export interface PerfMetricSample {
	name: string;
	step: string;
	durationMs: number;
	recordedAt: number;
	context: Record<string, PerfMetricContextValue>;
}

const PERF_SAMPLE_RETENTION_MS = 30 * 60 * 1_000;
const MAX_PERF_SAMPLES = 1_000;
const perfSamples: PerfMetricSample[] = [];

function roundDuration(startedAt: number) {
	return Math.round(performance.now() - startedAt);
}

function normalizeContext(
	parts: Array<Record<string, unknown>>,
): Record<string, PerfMetricContextValue> {
	const normalized: Record<string, PerfMetricContextValue> = {};

	for (const part of parts) {
		for (const [key, value] of Object.entries(part)) {
			if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
				normalized[key] = value;
				continue;
			}

			if (value == null) {
				normalized[key] = null;
			}
		}
	}

	return normalized;
}

function prunePerfSamples(now = Date.now()) {
	const cutoff = now - PERF_SAMPLE_RETENTION_MS;
	let deleteCount = 0;

	while (deleteCount < perfSamples.length && perfSamples[deleteCount].recordedAt < cutoff) {
		deleteCount += 1;
	}

	if (deleteCount > 0) {
		perfSamples.splice(0, deleteCount);
	}

	if (perfSamples.length > MAX_PERF_SAMPLES) {
		perfSamples.splice(0, perfSamples.length - MAX_PERF_SAMPLES);
	}
}

function recordPerfSample(
	name: string,
	step: string,
	durationMs: number,
	context: Record<string, PerfMetricContextValue>,
) {
	perfSamples.push({
		name,
		step,
		durationMs,
		recordedAt: Date.now(),
		context,
	});
	prunePerfSamples();
}

export function getRecentPerfSamples(windowMs = PERF_SAMPLE_RETENTION_MS) {
	const now = Date.now();
	prunePerfSamples(now);
	const cutoff = now - windowMs;
	return perfSamples.filter((sample) => sample.recordedAt >= cutoff);
}

export function resetPerfSamples() {
	perfSamples.length = 0;
}

export function createPerfTracker(name: string, baseContext: Record<string, unknown> = {}) {
	const requestStartedAt = performance.now();

	return {
		step(stepName: string, stepContext: Record<string, unknown> = {}): PerfStep {
			const startedAt = performance.now();
			return {
				end(details: Record<string, unknown> = {}) {
					const durationMs = roundDuration(startedAt);
					const context = normalizeContext([baseContext, stepContext, details]);
					console.info(`[perf] ${name}:${stepName}`, {
						...context,
						durationMs,
					});
					recordPerfSample(name, stepName, durationMs, context);
				},
			};
		},
		finish(details: Record<string, unknown> = {}) {
			const durationMs = roundDuration(requestStartedAt);
			const context = normalizeContext([baseContext, details]);
			console.info(`[perf] ${name}:total`, {
				...context,
				durationMs,
			});
			recordPerfSample(name, "total", durationMs, context);
		},
	};
}
