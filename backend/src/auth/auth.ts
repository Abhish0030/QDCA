import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";
import { env } from "../config/env";
import { prisma } from "../database";
import { sendPasswordResetEmail } from "../shared/lib/email-service";
import { buildAllowedOrigins } from "../shared/utils/allowed-origins";

const authBaseURL = normalizeAuthBaseUrl(env.BETTER_AUTH_URL);
const trustedOrigins = buildAllowedOrigins(env.FRONTEND_URL, authBaseURL);
const cookieAttributes = resolveCookieAttributes(env.FRONTEND_URL, authBaseURL);
const socialProviders = buildSocialProviders();

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: authBaseURL,
	trustedOrigins,
	advanced: {
		defaultCookieAttributes: {
			sameSite: cookieAttributes.sameSite,
			secure: cookieAttributes.secure,
		},
	},
	user: {
		additionalFields: {
			role: { type: "string", input: false, defaultValue: "user" },
			status: { type: "string", input: false, defaultValue: "active" },
		},
	},
	emailAndPassword: {
		enabled: true,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url }) => {
			try {
				await sendPasswordResetEmail({
					to: user.email,
					name: user.name,
					url,
				});
			} catch (error) {
				console.error("Failed to send password reset email", {
					message: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}
		},
	},
	...(socialProviders ? { socialProviders } : {}),
	plugins: [openAPI()],
});

function buildSocialProviders() {
	const providers: Record<string, { clientId: string; clientSecret: string }> = {};

	if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
		providers.google = {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		};
	}

	if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
		providers.github = {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		};
	}

	return Object.keys(providers).length ? providers : undefined;
}

function normalizeAuthBaseUrl(value: string) {
	const url = new URL(value);
	if (url.pathname === "/" || !url.pathname) {
		url.pathname = "/api/auth";
	}
	return url.toString().replace(/\/$/, "");
}

function resolveCookieAttributes(frontendUrl: string, backendUrl: string) {
	const isCrossOrigin = isCrossOriginUrl(frontendUrl, backendUrl);
	const isLoopback = isLoopbackUrl(frontendUrl) && isLoopbackUrl(backendUrl);

	if (isLoopback) {
		return {
			sameSite: "lax" as const,
			secure: false,
		};
	}

	return {
		sameSite: isCrossOrigin ? ("none" as const) : ("lax" as const),
		secure: true,
	};
}

function isCrossOriginUrl(left: string, right: string) {
	try {
		return new URL(left).origin !== new URL(right).origin;
	} catch {
		return false;
	}
}

function isLoopbackUrl(value: string) {
	try {
		const { hostname } = new URL(value);
		return hostname === "localhost" || hostname === "127.0.0.1";
	} catch {
		return false;
	}
}
