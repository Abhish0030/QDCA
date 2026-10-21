import type { Request, Response } from "express";
import { env } from "../../../config/env";
import { prisma } from "../../../database";
import {
	buildOllamaHeaders,
	generationOptions,
	requestOllama,
} from "../../questions/services/ollama-client";
import { isEmailConfigured, verifyEmailTransport } from "../../../shared/lib/email-service";

const APP_HEALTH_RESPONSE = {
	success: true,
	message: "QDCA API is running successfully 🚀",
	version: "1.0.0",
	status: "healthy",
} as const;

let cachedEmailStatus: {
	value: "healthy" | "unhealthy" | "unconfigured";
	expiresAt: number;
} | null = null;
let cachedOllamaStatus: {
	value: "healthy" | "unhealthy" | "unconfigured";
	expiresAt: number;
} | null = null;

export function getAppHealth(_req: Request, res: Response) {
	res.status(200).json(APP_HEALTH_RESPONSE);
}

export async function getHealth(_req: Request, res: Response) {
	const uptime = process.uptime();

	let dbStatus: "healthy" | "unhealthy" = "unhealthy";
	try {
		await prisma.$queryRaw`SELECT 1`;
		dbStatus = "healthy";
	} catch {
		dbStatus = "unhealthy";
	}

	const ollamaStatus = await getOllamaStatus();
	const emailStatus = await getEmailStatus();
	const hasCriticalFailure =
		dbStatus === "unhealthy" || emailStatus === "unhealthy" || ollamaStatus === "unhealthy";
	const status = hasCriticalFailure ? "degraded" : "healthy";

	res.status(status === "healthy" ? 200 : 503).json({
		success: true,
		status,
		timestamp: new Date().toISOString(),
		environment: env.NODE_ENV,
		uptime: Math.floor(uptime),
		services: {
			database: dbStatus,
			ollama: ollamaStatus,
			email: emailStatus,
		},
	});
}

async function getOllamaStatus() {
	if (cachedOllamaStatus && cachedOllamaStatus.expiresAt > Date.now()) {
		return cachedOllamaStatus.value;
	}

	let value: "healthy" | "unhealthy" | "unconfigured" = "unconfigured";
	if (env.OLLAMA_BASE_URL) {
		value = await probeOllamaReadiness();
	}

	cachedOllamaStatus = {
		value,
		expiresAt: Date.now() + 60_000,
	};

	return value;
}

async function probeOllamaReadiness() {
	try {
		const versionResponse = await fetch(`${env.OLLAMA_BASE_URL}/api/version`, {
			headers: buildOllamaHeaders(),
			signal: AbortSignal.timeout(3_000),
		});
		if (!versionResponse.ok) {
			return "unhealthy" as const;
		}

		const model =
			env.OLLAMA_FAST_MODEL?.trim() ||
			env.OLLAMA_GEMMA_MODEL?.trim() ||
			env.OLLAMA_LLAMA_MODEL?.trim() ||
			"gemma3:1b";

		await requestOllama<{ response?: string }>(
			"/api/generate",
			{
				model,
				stream: false,
				prompt: "Reply with READY only.",
				options: generationOptions(0, 8, 1),
			},
			12_000,
		);

		return "healthy" as const;
	} catch {
		return "unhealthy" as const;
	}
}

async function getEmailStatus() {
	if (cachedEmailStatus && cachedEmailStatus.expiresAt > Date.now()) {
		return cachedEmailStatus.value;
	}

	if (!isEmailConfigured()) {
		return "unconfigured" as const;
	}

	try {
		await verifyEmailTransport();
		cachedEmailStatus = {
			value: "healthy",
			expiresAt: Date.now() + 60_000,
		};
		return "healthy" as const;
	} catch {
		cachedEmailStatus = {
			value: "unhealthy",
			expiresAt: Date.now() + 60_000,
		};
		return "unhealthy" as const;
	}
}
