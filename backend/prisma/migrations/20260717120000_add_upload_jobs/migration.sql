CREATE TABLE "upload_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "normalizedSourceText" TEXT,
    "questionsExtracted" INTEGER NOT NULL DEFAULT 0,
    "questionsClassified" INTEGER NOT NULL DEFAULT 0,
    "classificationFailures" INTEGER NOT NULL DEFAULT 0,
    "indexedChunks" INTEGER NOT NULL DEFAULT 0,
    "embeddingModel" TEXT,
    "extractionMethod" TEXT,
    "warningMessage" TEXT,
    "errorMessage" TEXT,
    "retryAvailable" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_jobs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "rag_document_chunks"
ADD COLUMN "uploadJobId" TEXT;

CREATE INDEX "upload_jobs_userId_createdAt_idx"
ON "upload_jobs"("userId", "createdAt");

CREATE INDEX "upload_jobs_status_createdAt_idx"
ON "upload_jobs"("status", "createdAt");

CREATE INDEX "rag_document_chunks_uploadJobId_idx"
ON "rag_document_chunks"("uploadJobId");

ALTER TABLE "upload_jobs"
ADD CONSTRAINT "upload_jobs_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rag_document_chunks"
ADD CONSTRAINT "rag_document_chunks_uploadJobId_fkey"
FOREIGN KEY ("uploadJobId") REFERENCES "upload_jobs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
