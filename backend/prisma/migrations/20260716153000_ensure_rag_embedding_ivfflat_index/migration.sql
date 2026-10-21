CREATE INDEX IF NOT EXISTS "rag_document_chunks_embedding_cosine_idx"
ON "rag_document_chunks"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);
