import type { NextFunction, Request, Response } from "express";
import { getRequestSession, hasAdminAccess } from "../auth/session";
import { env } from "../config/env";
import { prisma } from "../database";
import { buildAllowedOrigins, isLoopbackOrigin } from "../shared/utils/allowed-origins";
import { AppError } from "../shared/utils/app-error";

const SETTINGS_CACHE_TTL_MS = 5_000;

let cachedSettings: {
	value: { maintenanceMode: boolean; signupsEnabled: boolean };
	expiresAt: number;
} | null = null;

export function applySecurityHeaders(_req: Request, res: Response, next: NextFunction) {
	res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
	next();
}

export function enforceTrustedOrigin(req: Request, _res: Response, next: NextFunction) {
	if (["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase())) {
		return next();
	}

	const origin = toOrigin(req.get("origin"));
	const referer = toOrigin(req.get("referer"));

	if (isAllowedRequestOrigin(origin) || isAllowedRequestOrigin(referer)) {
		return next();
	}

	if (!origin && !referer) {
		return next();
	}

	return next(new AppError("This request origin is not allowed", 403));
}

export async function enforceMaintenanceMode(req: Request, _res: Response, next: NextFunction) {
	try {
		const settings = await getPlatformSettings();
		if (!settings.maintenanceMode) {
			return next();
		}

		const session = await getRequestSession(req);
		if (session?.user?.id && (await hasAdminAccess(session.user.id))) {
			return next();
		}

		return next(new AppError("QDCA is temporarily in maintenance mode", 503));
	} catch (error) {
		return next(error);
	}
}

export async function enforceSignupAvailability(req: Request, _res: Response, next: NextFunction) {
	try {
		if (!isSignupRequest(req)) {
			return next();
		}

		const settings = await getPlatformSettings();
		if (settings.signupsEnabled) {
			return next();
		}

		return next(new AppError("New account registration is temporarily disabled", 503));
	} catch (error) {
		return next(error);
	}
}

async function getPlatformSettings() {
	if (cachedSettings && cachedSettings.expiresAt > Date.now()) {
		return cachedSettings.value;
	}

	const settings = await prisma.adminSetting.upsert({
		where: { id: "default" },
		update: {},
		create: { id: "default" },
		select: {
			maintenanceMode: true,
			signupsEnabled: true,
		},
	});

	cachedSettings = {
		value: settings,
		expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS,
	};

	return settings;
}

function isSignupRequest(req: Request) {
	if (req.method.toUpperCase() !== "POST") {
		return false;
	}

	const path = `${req.baseUrl}${req.path}`.toLowerCase();
	return path.includes("/sign-up") || path.includes("/signup");
}

function toOrigin(value: string | undefined) {
	if (!value) {
		return null;
	}

	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

function isAllowedRequestOrigin(value: string | null) {
	if (!value) {
		return false;
	}

	const allowedOrigins = new Set(buildAllowedOrigins(env.FRONTEND_URL, env.BETTER_AUTH_URL));
	return allowedOrigins.has(value) || isLoopbackOrigin(value);
}
