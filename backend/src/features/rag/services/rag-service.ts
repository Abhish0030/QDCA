import { randomUUID } from "node:crypto";
import { env } from "../../../config/env";
import { prisma } from "../../../database";
import { generationOptions, requestOllama } from "../../questions/services/ollama-client";

const EMBEDDING_MODEL = env.OLLAMA_EMBEDDING_MODEL?.trim() || "nomic-embed-text";
const MATCH_THRESHOLD = readThreshold(env.RAG_MATCH_THRESHOLD, 0.55);
const MAX_MATCHES = 4;
const EMBEDDING_BATCH_SIZE = 16;

interface OllamaEmbedResponse {
	embeddings?: number[][];
}

interface RagRow {
	id: string;
	source: string | null;
	text: string;
	similarity: number;
}

export interface RagRetrieval {
	available: boolean;
	grounded: boolean;
	status: "grounded" | "no_match" | "unavailable";
	chunkCount: number;
	sources: string[];
	topSimilarity: number | null;
	context: string;
}

export async function indexRagDocument(input: {
	userId: string;
	source: string;
	text: string;
	uploadJobId?: string;
}) {
	const chunks = chunkDocument(input.text);
	if (chunks.length === 0) {
		return { chunkCount: 0, embeddingModel: EMBEDDING_MODEL };
	}

	const embeddings: number[][] = [];
	for (let start = 0; start < chunks.length; start += EMBEDDING_BATCH_SIZE) {
		embeddings.push(...(await embedTexts(chunks.slice(start, start + EMBEDDING_BATCH_SIZE))));
	}

	await prisma.$transaction(async (transaction) => {
		await transaction.$executeRaw`
			DELETE FROM "rag_document_chunks"
			WHERE "userId" = ${input.userId} AND "source" = ${input.source}
		`;

		for (const [index, chunk] of chunks.entries()) {
			const vector = toVectorLiteral(embeddings[index] ?? []);
			await transaction.$executeRaw`
				INSERT INTO "rag_document_chunks"
					("id", "userId", "uploadJobId", "source", "text", "embedding", "createdAt", "updatedAt")
				VALUES
					(${randomUUID()}, ${input.userId}, ${input.uploadJobId ?? null}, ${input.source}, ${chunk}, ${vector}::vector, NOW(), NOW())
			`;
		}
	});

	return { chunkCount: chunks.length, embeddingModel: EMBEDDING_MODEL };
}

export async function retrieveRagContext(question: string, userId?: string): Promise<RagRetrieval> {
	try {
		const [embedding] = await embedTexts([question]);
		const vector = toVectorLiteral(embedding ?? []);
		const rows = userId
			? await prisma.$queryRaw<RagRow[]>`
				SELECT "id", "source", "text",
					(1 - ("embedding" <=> ${vector}::vector))::float8 AS "similarity"
				FROM "rag_document_chunks"
				WHERE "userId" = ${userId}
				ORDER BY "embedding" <=> ${vector}::vector
				LIMIT ${MAX_MATCHES}
			`
			: await prisma.$queryRaw<RagRow[]>`
				SELECT "id", "source", "text",
					(1 - ("embedding" <=> ${vector}::vector))::float8 AS "similarity"
				FROM "rag_document_chunks"
				WHERE "userId" IS NULL
				ORDER BY "embedding" <=> ${vector}::vector
				LIMIT ${MAX_MATCHES}
			`;
		const matches = rows.filter((row) => Number(row.similarity) >= MATCH_THRESHOLD);
		const topSimilarity = rows.length > 0 ? Number(rows[0]?.similarity) : null;

		if (matches.length === 0) {
			return emptyRetrieval("no_match", true, topSimilarity);
		}

		return {
			available: true,
			grounded: true,
			status: "grounded",
			chunkCount: matches.length,
			sources: [...new Set(matches.map((match) => match.source).filter(Boolean))] as string[],
			topSimilarity,
			context: matches
				.map(
					(match, index) =>
						`[Source ${index + 1}: ${match.source ?? "Indexed material"}]\n${match.text}`,
				)
				.join("\n\n"),
		};
	} catch (error) {
		console.warn("[rag] retrieval unavailable", {
			message: error instanceof Error ? error.message : String(error),
		});
		return emptyRetrieval("unavailable", false, null);
	}
}

export function chunkDocument(text: string, targetSize = 900, overlap = 150) {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (!normalized) return [];

	const chunks: string[] = [];
	let start = 0;
	while (start < normalized.length) {
		let end = Math.min(start + targetSize, normalized.length);
		if (end < normalized.length) {
			const boundary = Math.max(
				normalized.lastIndexOf(". ", end),
				normalized.lastIndexOf("? ", end),
				normalized.lastIndexOf("! ", end),
			);
			if (boundary > start + targetSize / 2) end = boundary + 1;
		}
		const chunk = normalized.slice(start, end).trim();
		if (chunk.length >= 40) chunks.push(chunk);
		if (end >= normalized.length) break;
		start = Math.max(end - overlap, start + 1);
	}
	return chunks.slice(0, 500);
}

async function embedTexts(texts: string[]) {
	if (!env.OLLAMA_BASE_URL) {
		throw new Error("RAG embeddings are unavailable because OLLAMA_BASE_URL is not configured");
	}

	const payload = await requestOllama<OllamaEmbedResponse>(
		"/api/embed",
		{
			model: EMBEDDING_MODEL,
			input: texts,
			options: generationOptions(0, 1),
		},
		60_000,
	);
	if (!payload.embeddings || payload.embeddings.length !== texts.length) {
		throw new Error("Ollama returned an invalid embedding response");
	}
	return payload.embeddings;
}

function toVectorLiteral(embedding: number[]) {
	if (embedding.length === 0 || embedding.some((value) => !Number.isFinite(value))) {
		throw new Error("Embedding vector is empty or invalid");
	}
	return `[${embedding.join(",")}]`;
}

function emptyRetrieval(
	status: "no_match" | "unavailable",
	available: boolean,
	topSimilarity: number | null,
): RagRetrieval {
	return {
		available,
		grounded: false,
		status,
		chunkCount: 0,
		sources: [],
		topSimilarity,
		context: "",
	};
}

function readThreshold(value: number | undefined, fallback: number) {
	return typeof value === "number" && Number.isFinite(value)
		? Math.min(1, Math.max(0, value))
		: fallback;
}
