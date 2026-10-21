ALTER TABLE "rag_document_chunks" ADD COLUMN "userId" TEXT;

CREATE INDEX "rag_document_chunks_userId_source_idx"
ON "rag_document_chunks"("userId", "source");

ALTER TABLE "rag_document_chunks"
ADD CONSTRAINT "rag_document_chunks_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
