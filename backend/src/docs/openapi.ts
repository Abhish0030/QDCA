import { env } from "../config/env";

type OpenApiSchema = Record<string, unknown>;

function operation(tag: string, summary: string, secure = true) {
	return {
		tags: [tag],
		summary,
		...(secure ? { security: [{ sessionCookie: [] }] } : {}),
		responses: {
			"200": { description: "Request completed successfully." },
			"400": { description: "Invalid request." },
			"401": { description: "Authentication required." },
			"403": { description: "Insufficient permissions." },
		},
	};
}

interface OpenApiDocument {
	openapi: string;
	info: {
		title: string;
		description: string;
		version: string;
	};
	servers: Array<{
		url: string;
		description: string;
	}>;
	tags: Array<{
		name: string;
		description: string;
	}>;
	paths: Record<string, unknown>;
	components: {
		schemas: Record<string, OpenApiSchema>;
		securitySchemes: Record<string, OpenApiSchema>;
	};
}

export const openApiDocument: OpenApiDocument = {
	openapi: "3.1.0",
	info: {
		title: "Question Difficulty Classification API",
		description: "OpenAPI documentation for the backend API.",
		version: "1.0.0",
	},
	servers: [
		{
			url: env.BETTER_AUTH_URL,
			description: `${env.NODE_ENV} server`,
		},
	],
	tags: [
		{
			name: "Health",
			description: "Service and dependency health checks.",
		},
		{ name: "Chatbot", description: "Context-aware assistant endpoints." },
		{ name: "Activity", description: "Authenticated cross-user activity feed." },
		{ name: "Leaderboard", description: "Authenticated contributor rankings." },
		{ name: "Classification", description: "Question classification and subject analysis." },
		{ name: "Dashboard", description: "Dashboard metrics and trends." },
		{ name: "Questions", description: "Question discovery and learning-roadmap endpoints." },
		{ name: "Notifications", description: "Authenticated user notifications." },
		{ name: "Uploads", description: "Authenticated PDF ingestion and RAG indexing." },
		{ name: "Reports", description: "Authenticated generated reports." },
		{ name: "Admin", description: "Administrator platform-management endpoints." },
	],
	paths: {
		"/api/health": {
			get: {
				tags: ["Health"],
				summary: "Get API health",
				description: "Returns application uptime, environment, and database status.",
				operationId: "getHealth",
				responses: {
					"200": {
						description: "Health check completed.",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/HealthResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/chatbot/message": { post: operation("Chatbot", "Send a chatbot message") },
		"/api/activity": { get: operation("Activity", "List recent platform activity") },
		"/api/leaderboard": { get: operation("Leaderboard", "List contributor leaderboard") },
		"/api/classify": { post: operation("Classification", "Classify a question") },
		"/api/classify/answer": { post: operation("Classification", "Generate an answer") },
		"/api/classify/change-difficulty": {
			post: operation("Classification", "Regenerate a question at a different difficulty"),
		},
		"/api/dashboard/summary": { get: operation("Dashboard", "Get dashboard summary") },
		"/api/dashboard/difficulty-distribution": {
			get: operation("Dashboard", "Get difficulty distribution"),
		},
		"/api/dashboard/question-trend": { get: operation("Dashboard", "Get question trend") },
		"/api/questions": { get: operation("Questions", "List questions") },
		"/api/questions/similar": { post: operation("Questions", "Find similar questions") },
		"/api/questions/subject-detection": {
			post: operation("Classification", "Detect question subject"),
		},
		"/api/questions/study-roadmap": { get: operation("Questions", "Get study roadmap") },
		"/api/notifications": { get: operation("Notifications", "List notifications") },
		"/api/notifications/read-all": {
			patch: operation("Notifications", "Mark notifications as read"),
		},
		"/api/notifications/{id}": {
			delete: operation("Notifications", "Dismiss a notification"),
		},
		"/api/uploads/pdf": { post: operation("Uploads", "Upload and process a document") },
		"/api/reports": { get: operation("Reports", "List generated reports") },
		"/api/admin/stats": { get: operation("Admin", "Get platform statistics") },
		"/api/admin/activity": { get: operation("Admin", "Get platform activity") },
		"/api/admin/difficulty-distribution": {
			get: operation("Admin", "Get platform difficulty distribution"),
		},
		"/api/admin/recent-signups": { get: operation("Admin", "Get recent signups") },
		"/api/admin/recent-actions": { get: operation("Admin", "Get recent admin actions") },
		"/api/admin/users": { get: operation("Admin", "List users") },
		"/api/admin/users/{id}": {
			get: operation("Admin", "Get a user"),
			delete: operation("Admin", "Delete a user"),
		},
		"/api/admin/users/{id}/role": { patch: operation("Admin", "Change a user role") },
		"/api/admin/users/{id}/status": { patch: operation("Admin", "Change a user status") },
		"/api/admin/questions": { get: operation("Admin", "List platform questions") },
		"/api/admin/questions/{id}/override": {
			patch: operation("Admin", "Override question difficulty"),
		},
		"/api/admin/uploads": { get: operation("Admin", "List upload jobs") },
		"/api/admin/uploads/{id}/retry": { post: operation("Admin", "Retry upload indexing") },
		"/api/admin/analytics": { get: operation("Admin", "Get platform analytics") },
		"/api/admin/settings": {
			get: operation("Admin", "Get platform settings"),
			patch: operation("Admin", "Update platform settings"),
		},
	},
	components: {
		securitySchemes: {
			sessionCookie: {
				type: "apiKey",
				in: "cookie",
				name: "better-auth.session_token",
			},
		},
		schemas: {
			HealthResponse: {
				type: "object",
				required: ["success", "status", "timestamp", "environment", "uptime", "services"],
				properties: {
					success: {
						type: "boolean",
						examples: [true],
					},
					status: {
						type: "string",
						enum: ["healthy", "degraded"],
					},
					timestamp: {
						type: "string",
						format: "date-time",
					},
					environment: {
						type: "string",
						enum: ["development", "production", "test"],
					},
					uptime: {
						type: "integer",
						minimum: 0,
					},
					services: {
						type: "object",
						required: ["database", "ollama", "email"],
						properties: {
							database: {
								type: "string",
								enum: ["healthy", "unhealthy"],
							},
							ollama: {
								type: "string",
								enum: ["healthy", "unhealthy"],
							},
							email: {
								type: "string",
								enum: ["healthy", "unhealthy", "unconfigured"],
							},
						},
					},
				},
			},
			ErrorResponse: {
				type: "object",
				required: ["success", "message"],
				properties: {
					success: {
						type: "boolean",
						examples: [false],
					},
					message: {
						type: "string",
					},
				},
			},
		},
	},
};
