ALTER TABLE "rag_document_chunks"
ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE INDEX IF NOT EXISTS "rag_document_chunks_userId_source_idx"
ON "rag_document_chunks"("userId", "source");

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'rag_document_chunks_userId_fkey'
	) THEN
		ALTER TABLE "rag_document_chunks"
		ADD CONSTRAINT "rag_document_chunks_userId_fkey"
		FOREIGN KEY ("userId") REFERENCES "users"("id")
		ON DELETE CASCADE ON UPDATE CASCADE;
	END IF;
END $$;
