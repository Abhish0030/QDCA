import type { UploadJob } from "@prisma/client";
import { prisma } from "../../../database";
import { AppError } from "../../../shared/utils/app-error";
import { indexRagDocument } from "../../rag/services/rag-service";

type UploadJobStatus = "pending" | "processing" | "done" | "failed";

interface CreateUploadJobInput {
	userId: string;
	filename: string;
	mimeType?: string;
	fileSize?: number;
}

export interface AdminUploadRecord {
	id: string;
	filename: string;
	uploadedBy: string;
	date: string;
	questionsExtracted: number;
	questionsClassified: number;
	indexedChunks: number;
	status: UploadJobStatus;
	errorMessage: string | null;
	warningMessage: string | null;
	retryAvailable: boolean;
	attemptCount: number;
}

const INDEXING_WARNING_MESSAGE =
	"PDF text was extracted, but semantic indexing is currently unavailable. You can still review the extracted questions.";

export async function createUploadJob(input: CreateUploadJobInput) {
	return prisma.uploadJob.create({
		data: {
			userId: input.userId,
			filename: input.filename,
			mimeType: input.mimeType,
			fileSize: input.fileSize,
			status: "processing",
			startedAt: new Date(),
		},
	});
}

export async function storeUploadExtraction(
	id: string,
	data: {
		normalizedSourceText: string;
		questionsExtracted: number;
		questionsClassified: number;
		classificationFailures: number;
		extractionMethod: string;
	},
) {
	return prisma.uploadJob.update({
		where: { id },
		data: {
			normalizedSourceText: data.normalizedSourceText,
			questionsExtracted: data.questionsExtracted,
			questionsClassified: data.questionsClassified,
			classificationFailures: data.classificationFailures,
			extractionMethod: data.extractionMethod,
			retryAvailable: false,
			errorMessage: null,
		},
	});
}

export async function finalizeUploadJobSuccess(
	id: string,
	data: { indexedChunks: number; embeddingModel: string; warningMessage?: string | null },
) {
	return prisma.uploadJob.update({
		where: { id },
		data: {
			status: data.warningMessage ? "failed" : "done",
			indexedChunks: data.indexedChunks,
			embeddingModel: data.embeddingModel,
			warningMessage: data.warningMessage ?? null,
			errorMessage: data.warningMessage ? data.warningMessage : null,
			retryAvailable: Boolean(data.warningMessage),
			finishedAt: new Date(),
		},
	});
}

export async function markUploadJobFailed(
	id: string,
	error: unknown,
	options?: { retryAvailable?: boolean; warningMessage?: string | null },
) {
	return prisma.uploadJob.update({
		where: { id },
		data: {
			status: "failed",
			errorMessage: getErrorMessage(error),
			warningMessage: options?.warningMessage ?? null,
			retryAvailable: options?.retryAvailable ?? false,
			finishedAt: new Date(),
		},
	});
}

export async function listAdminUploadJobs(page: number, limit: number) {
	const [jobs, total] = await Promise.all([
		prisma.uploadJob.findMany({
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * limit,
			take: limit,
			include: {
				user: { select: { name: true } },
			},
		}),
		prisma.uploadJob.count(),
	]);

	return {
		uploads: jobs.map((job) => mapAdminUpload(job, job.user?.name ?? "Unknown User")),
		total,
	};
}

export async function retryUploadJobIndexing(id: string) {
	const job = await prisma.uploadJob.findUnique({
		where: { id },
	});

	if (!job) {
		throw new AppError("Upload job not found", 404);
	}

	if (job.status !== "failed") {
		throw new AppError("Only failed upload jobs can be retried", 409);
	}

	if (!job.normalizedSourceText?.trim()) {
		throw new AppError(
			"This upload cannot be retried because no extracted source text was stored for it.",
			409,
		);
	}

	await prisma.uploadJob.update({
		where: { id },
		data: {
			status: "processing",
			attemptCount: { increment: 1 },
			indexedChunks: 0,
			errorMessage: null,
			warningMessage: null,
			retryAvailable: false,
			startedAt: new Date(),
			finishedAt: null,
		},
	});

	try {
		const indexed = await indexRagDocument({
			userId: job.userId,
			source: job.filename,
			text: job.normalizedSourceText,
			uploadJobId: job.id,
		});

		const updated = await prisma.uploadJob.update({
			where: { id },
			data: {
				status: "done",
				indexedChunks: indexed.chunkCount,
				embeddingModel: indexed.embeddingModel,
				retryAvailable: false,
				finishedAt: new Date(),
			},
			include: {
				user: { select: { name: true } },
			},
		});

		return {
			success: true,
			upload: mapAdminUpload(updated, updated.user?.name ?? "Unknown User"),
		};
	} catch (error) {
		await markUploadJobFailed(id, error, {
			retryAvailable: true,
			warningMessage: INDEXING_WARNING_MESSAGE,
		});
		throw error;
	}
}

export function mapAdminUpload(job: UploadJob, uploadedBy: string): AdminUploadRecord {
	return {
		id: job.id,
		filename: job.filename,
		uploadedBy,
		date: formatDisplayDate(job.createdAt),
		questionsExtracted: job.questionsExtracted,
		questionsClassified: job.questionsClassified,
		indexedChunks: job.indexedChunks,
		status: normalizeUploadStatus(job.status),
		errorMessage: job.errorMessage,
		warningMessage: job.warningMessage,
		retryAvailable: job.retryAvailable,
		attemptCount: job.attemptCount,
	};
}

export function normalizeUploadStatus(value: string): UploadJobStatus {
	if (value === "done" || value === "failed" || value === "pending" || value === "processing") {
		return value;
	}
	return "pending";
}

export function getIndexingWarningMessage() {
	return INDEXING_WARNING_MESSAGE;
}

function formatDisplayDate(value: Date) {
	return value.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}
