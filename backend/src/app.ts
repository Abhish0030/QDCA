import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";
import { auth } from "./auth";
import { env } from "./config/env";
import { registerSwaggerDocs } from "./docs/swagger";
import { activityRouter } from "./features/activity/routes/activity-routes";
import { adminRouter } from "./features/admin/routes/admin-routes";
import { chatbotRouter } from "./features/chatbot/routes/chatbot-routes";
import { dashboardRouter } from "./features/dashboard/routes/dashboard-routes";
import { getAppHealth } from "./features/health/controllers/health-controller";
import { healthRouter } from "./features/health/routes/health-routes";
import { leaderboardRouter } from "./features/leaderboard/routes/leaderboard-routes";
import { notificationRouter } from "./features/notifications/routes/notification-routes";
import { classificationRouter } from "./features/questions/routes/classification-routes";
import { questionRouter } from "./features/questions/routes/question-routes";
import { reportRouter } from "./features/reports/routes/report-routes";
import { settingsRouter } from "./features/settings/routes/settings-routes";
import { uploadRouter } from "./features/uploads/routes/upload-routes";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import {
	applySecurityHeaders,
	enforceMaintenanceMode,
	enforceSignupAvailability,
	enforceTrustedOrigin,
} from "./middleware/platform-policy";
import { createRateLimiter } from "./middleware/rate-limit";
import { buildAllowedOrigins, isLoopbackOrigin } from "./shared/utils/allowed-origins";

const app: Express = express();
const classifyRateLimiter = createRateLimiter({
	keyPrefix: "classify",
	windowMs: 60_000,
	max: 20,
	message: "Too many classification requests. Please wait a minute and try again.",
});
const chatbotRateLimiter = createRateLimiter({
	keyPrefix: "chatbot",
	windowMs: 60_000,
	max: 12,
	message: "Too many chatbot requests. Please wait a minute and try again.",
});
const allowedCorsOrigins = buildAllowedOrigins(env.FRONTEND_URL, env.BETTER_AUTH_URL);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || isAllowedCorsOrigin(origin)) {
				callback(null, true);
				return;
			}

			callback(new Error("This request origin is not allowed"));
		},
		credentials: true,
	}),
);
app.use(applySecurityHeaders);

registerSwaggerDocs(app);
app.use(enforceTrustedOrigin);
app.get("/", getAppHealth);
app.get("/health", getAppHealth);

// Express 5
app.use("/api/auth", logAuthDiagnostics);
app.use("/api/auth", enforceSignupAvailability);
app.all("/api/auth", toNodeHandler(auth));
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/health", healthRouter);
app.use("/api", enforceMaintenanceMode);
app.use("/api/chatbot", chatbotRateLimiter, chatbotRouter);
app.use("/api/activity", activityRouter);
app.use("/api/classify", classifyRateLimiter, classificationRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/questions", questionRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/reports", reportRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);

export { app };

function isAllowedCorsOrigin(value: string) {
	return allowedCorsOrigins.includes(value) || isLoopbackOrigin(value);
}

function logAuthDiagnostics(req: express.Request, _res: express.Response, next: express.NextFunction) {
	if (!env.AUTH_DEBUG_LOGS) {
		return next();
	}

	const cookieHeader = req.get("cookie") ?? "";
	const hasStateCookie =
		cookieHeader.includes("__Secure-better-auth.state=") ||
		cookieHeader.includes("better-auth.state=");

	if (req.path.includes("/sign-in/social")) {
		console.info("[auth-debug] social sign-in request", {
			method: req.method,
			path: req.originalUrl,
			origin: req.get("origin") ?? null,
			referer: req.get("referer") ?? null,
			callbackURL: req.body?.callbackURL ?? null,
			errorCallbackURL: req.body?.errorCallbackURL ?? null,
			hasStateCookie,
		});
	}

	if (req.path.includes("/callback/")) {
		console.info("[auth-debug] oauth callback request", {
			method: req.method,
			path: req.originalUrl,
			origin: req.get("origin") ?? null,
			referer: req.get("referer") ?? null,
			state: typeof req.query.state === "string" ? req.query.state : null,
			error: typeof req.query.error === "string" ? req.query.error : null,
			hasStateCookie,
		});
	}

	return next();
}
