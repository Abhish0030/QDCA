ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS "admin_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "aiModel" TEXT NOT NULL DEFAULT 'auto',
  "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.55,
  "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  "signupsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_audit_logs_createdAt_idx"
ON "admin_audit_logs"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_audit_logs_actorId_fkey'
  ) THEN
    ALTER TABLE "admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "admin_settings" ("id", "updatedAt")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
