import assert from "node:assert/strict";
import test from "node:test";
import type { UploadJob } from "@prisma/client";
import { mapAdminUpload, normalizeUploadStatus } from "./upload-job-service";

function createUploadJob(overrides: Partial<UploadJob> = {}): UploadJob {
	return {
		id: "job_1",
		userId: "user_1",
		filename: "sample.pdf",
		mimeType: "application/pdf",
		fileSize: 1024,
		status: "failed",
		attemptCount: 2,
		normalizedSourceText: "Normalized text",
		questionsExtracted: 12,
		questionsClassified: 10,
		classificationFailures: 2,
		indexedChunks: 0,
		embeddingModel: null,
		extractionMethod: "text",
		warningMessage:
			"PDF text was extracted, but semantic indexing is currently unavailable. You can still review the extracted questions.",
		errorMessage: "Ollama returned an invalid embedding response",
		retryAvailable: true,
		startedAt: new Date("2026-07-17T10:00:00.000Z"),
		finishedAt: new Date("2026-07-17T10:01:00.000Z"),
		createdAt: new Date("2026-07-17T10:00:00.000Z"),
		updatedAt: new Date("2026-07-17T10:01:00.000Z"),
		...overrides,
	};
}

test("normalizes unknown upload job statuses to pending", () => {
	assert.equal(normalizeUploadStatus("mystery"), "pending");
	assert.equal(normalizeUploadStatus("processing"), "processing");
});

test("maps failed upload jobs for the admin uploads table with retry metadata", () => {
	const mapped = mapAdminUpload(createUploadJob(), "Admin User");

	assert.deepEqual(
		{
			id: mapped.id,
			filename: mapped.filename,
			uploadedBy: mapped.uploadedBy,
			questionsExtracted: mapped.questionsExtracted,
			questionsClassified: mapped.questionsClassified,
			indexedChunks: mapped.indexedChunks,
			status: mapped.status,
			errorMessage: mapped.errorMessage,
			retryAvailable: mapped.retryAvailable,
			attemptCount: mapped.attemptCount,
		},
		{
			id: "job_1",
			filename: "sample.pdf",
			uploadedBy: "Admin User",
			questionsExtracted: 12,
			questionsClassified: 10,
			indexedChunks: 0,
			status: "failed",
			errorMessage: "Ollama returned an invalid embedding response",
			retryAvailable: true,
			attemptCount: 2,
		},
	);
});

test("maps completed upload jobs without retry affordance", () => {
	const mapped = mapAdminUpload(
		createUploadJob({
			status: "done",
			indexedChunks: 18,
			errorMessage: null,
			warningMessage: null,
			retryAvailable: false,
		}),
		"Uploader",
	);

	assert.equal(mapped.status, "done");
	assert.equal(mapped.indexedChunks, 18);
	assert.equal(mapped.errorMessage, null);
	assert.equal(mapped.retryAvailable, false);
});
