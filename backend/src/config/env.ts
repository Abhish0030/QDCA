import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.coerce.number().default(3000),
	DATABASE_URL: z.string().min(1),
	BETTER_AUTH_SECRET: z.string().min(1),
	BETTER_AUTH_URL: z.string().url(),
	FRONTEND_URL: z.string().url().default("http://localhost:5173"),
	GOOGLE_CLIENT_ID: z.string().min(1).optional(),
	GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
	GITHUB_CLIENT_ID: z.string().min(1).optional(),
	GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
	AUTH_DEBUG_LOGS: z
		.string()
		.optional()
		.transform((value) => value?.toLowerCase() === "true"),
	EMAIL_FROM: z.string().min(1).optional(),
	SMTP_HOST: z.string().min(1).optional(),
	SMTP_PORT: z.coerce.number().int().positive().optional(),
	SMTP_SECURE: z
		.string()
		.optional()
		.transform((value) => value?.toLowerCase() === "true"),
	SMTP_USER: z.string().min(1).optional(),
	SMTP_PASS: z.string().min(1).optional(),
	ADMIN_EMAILS: z.string().optional(),
	GROQ_API_KEY: z.string().min(1).optional(),
	GROQ_BASE_URL: z.string().url().optional(),
	OPENROUTER_API_KEY: z.string().min(1).optional(),
	OPENROUTER_GEMMA_API_KEY: z.string().min(1).optional(),
	OPENROUTER_BASE_URL: z.string().url().optional(),
	OPENROUTER_NEMOTRON_MODEL: z.string().min(1).optional(),
	OLLAMA_API_KEY: z.string().min(1).optional(),
	OLLAMA_BASE_URL: z.string().url().optional(),
	OLLAMA_LLAMA_MODEL: z.string().min(1).optional(),
	OLLAMA_GEMMA_MODEL: z.string().min(1).optional(),
	OLLAMA_NEMOTRON_MODEL: z.string().min(1).optional(),
	OLLAMA_EMBEDDING_MODEL: z.string().min(1).optional(),
	OLLAMA_FAST_MODEL: z.string().min(1).optional(),
	OLLAMA_FALLBACK_MODEL: z.string().min(1).optional(),
	OLLAMA_CHAT_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
	OLLAMA_CHAT_NUM_PREDICT: z.coerce.number().int().positive().optional(),
	OLLAMA_CHAT_MESSAGE_LIMIT: z.coerce.number().int().positive().optional(),
	OLLAMA_CHAT_CONTEXT_CACHE_TTL_MS: z.coerce.number().int().min(0).optional(),
	OLLAMA_CHAT_TEMPERATURE_X100: z.coerce.number().int().min(0).optional(),
	RAG_MATCH_THRESHOLD: z.coerce.number().min(0).max(1).optional(),
	OLLAMA_NUM_CTX: z.coerce.number().int().positive().optional(),
	OLLAMA_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
	OLLAMA_KEEP_ALIVE: z.string().min(1).optional(),
	OLLAMA_NEMOTRON_KEEP_ALIVE: z.string().min(1).optional(),
	PDF_DEBUG: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
	process.exit(1);
}

export const env = parsed.data;
