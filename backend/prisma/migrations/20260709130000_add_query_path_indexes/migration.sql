CREATE INDEX IF NOT EXISTS "questions_createdById_createdAt_idx"
ON "questions"("createdById", "createdAt");

CREATE INDEX IF NOT EXISTS "questions_createdAt_idx"
ON "questions"("createdAt");

CREATE INDEX IF NOT EXISTS "analyses_questionId_idx"
ON "analyses"("questionId");

CREATE INDEX IF NOT EXISTS "analyses_analyzedById_analyzedAt_idx"
ON "analyses"("analyzedById", "analyzedAt");

CREATE INDEX IF NOT EXISTS "rag_document_chunks_embedding_cosine_idx"
ON "rag_document_chunks"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);
