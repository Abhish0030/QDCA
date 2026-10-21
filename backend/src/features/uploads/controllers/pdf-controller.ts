import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireRequestSession } from "../../../auth/session";
import { env } from "../../../config/env";
import { prisma } from "../../../database";
import { recordActivity } from "../../activity/services/activity-service";
import { createNotification } from "../../notifications/services/notification-service";
import { classifyQuestionsBatch } from "../../questions/services/classification-service";
import { indexRagDocument } from "../../rag/services/rag-service";
import { extractDocumentContent } from "../services/pdf-service";
import {
	createUploadJob,
	finalizeUploadJobSuccess,
	getIndexingWarningMessage,
	markUploadJobFailed,
	storeUploadExtraction,
} from "../services/upload-job-service";

export async function uploadPdfHandler(req: Request, res: Response, next: NextFunction) {
	let uploadJobId = "";

	try {
		const session = await requireRequestSession(req);
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "A supported document file is required",
			});
		}

		const uploadJob = await createUploadJob({
			userId: session.user.id,
			filename: req.file.originalname,
			mimeType: req.file.mimetype,
			fileSize: req.file.size,
		});
		uploadJobId = uploadJob.id;

		const document = await extractDocumentContent(
			req.file.buffer,
			req.file.originalname,
			req.file.mimetype,
		);
		const classifications = await classifyQuestionsBatch(
			document.questions,
			session.user.id,
			"auto",
		);
		await storeUploadExtraction(uploadJob.id, {
			normalizedSourceText: document.text,
			questionsExtracted: document.questions.length,
			questionsClassified: classifications.items.length,
			classificationFailures: classifications.failed.length,
			extractionMethod: document.metadata.extractionMethod,
		});
		let indexed = {
			chunkCount: 0,
			embeddingModel: env.OLLAMA_EMBEDDING_MODEL?.trim() || "nomic-embed-text",
		};
		let indexingWarning: string | null = null;

		try {
			indexed = await indexRagDocument({
				userId: session.user.id,
				source: req.file.originalname,
				text: document.text,
				uploadJobId: uploadJob.id,
			});
		} catch (error) {
			indexingWarning = getIndexingWarningMessage();
			logPdfUpload("indexing_failed", {
				file: req.file.originalname,
				userId: session.user.id,
				message: error instanceof Error ? error.message : String(error),
			});
			await markUploadJobFailed(uploadJob.id, error, {
				retryAvailable: true,
				warningMessage: indexingWarning,
			});
		}

		if (!indexingWarning) {
			await finalizeUploadJobSuccess(uploadJob.id, {
				indexedChunks: indexed.chunkCount,
				embeddingModel: indexed.embeddingModel,
			});
		}

		await recordActivity({
			userId: session.user.id,
			actionType: "pdf_uploaded",
			description: `Uploaded and analyzed ${req.file.originalname}`,
			points: 15,
			metadata: {
				source: req.file.originalname,
				questionsExtracted: document.questions.length,
				questionsClassified: classifications.items.length,
				classificationFailures: classifications.failed.length,
				indexedChunks: indexed.chunkCount,
				indexingWarning,
				extractionMethod: document.metadata.extractionMethod,
				uploadJobId: uploadJob.id,
			},
		});
		await createNotification({
			userId: session.user.id,
			type: "pdf_uploaded",
			title: "Document analyzed",
			message: indexingWarning
				? `${classifications.items.length} questions classified from ${req.file.originalname}. Semantic indexing is temporarily unavailable.`
				: `${classifications.items.length} questions classified and ${indexed.chunkCount} RAG chunks indexed from ${req.file.originalname}`,
			entityType: "pdf",
		});
		return res.json({
			success: true,
			upload: {
				id: uploadJob.id,
				name: req.file.originalname,
				questions: document.questions.length,
				classifiedQuestions: classifications.items.length,
				classificationFailures: classifications.failed.length,
				indexedChunks: indexed.chunkCount,
				embeddingModel: indexed.embeddingModel,
				status: indexingWarning ? "failed" : "done",
			},
			questions: document.questions,
			classifications: classifications.items,
			classificationFailures: classifications.failed,
			warnings: [...(indexingWarning ? [indexingWarning] : []), ...document.metadata.warnings],
			metadata: document.metadata,
		});
	} catch (error) {
		if (uploadJobId) {
			try {
				await markUploadJobFailed(uploadJobId, error);
			} catch (updateError) {
				logPdfUpload("job_update_failed", {
					uploadJobId,
					message: updateError instanceof Error ? updateError.message : String(updateError),
				});
			}
		}
		return next(error);
	}
}

const uploadsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function listUploadHistoryHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = uploadsQuerySchema.safeParse(req.query);

		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid upload history limit" });
		}

		const items = await prisma.activityLog.findMany({
			where: {
				userId: session.user.id,
				actionType: "pdf_uploaded",
			},
			orderBy: { createdAt: "desc" },
			take: parsed.data.limit,
			select: {
				id: true,
				description: true,
				createdAt: true,
				metadata: true,
			},
		});

		return res.json({
			success: true,
			data: items.map((item) => {
				const metadata = isRecord(item.metadata) ? item.metadata : {};
				const name =
					typeof metadata.source === "string" ? metadata.source : readUploadName(item.description);
				const questions = toNumber(metadata.questionsExtracted);
				const classifiedQuestions = toNumber(metadata.questionsClassified);

				return {
					id: item.id,
					name,
					questions,
					classifiedQuestions,
					date: item.createdAt.toISOString(),
					status: "Completed",
				};
			}),
		});
	} catch (error) {
		return next(error);
	}
}

function logPdfUpload(event: string, data: Record<string, unknown>) {
	if (env.NODE_ENV === "production" && process.env.PDF_DEBUG !== "true") {
		return;
	}

	console.warn(`[pdf-upload] ${event}`, data);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown) {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readUploadName(description: string) {
	const matched = description.match(/Uploaded and analyzed\s+(.+)$/i);
	return matched?.[1]?.trim() || "Uploaded document";
}
