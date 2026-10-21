CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "username" TEXT,
  "phone" TEXT,
  "university" TEXT,
  "department" TEXT,
  "degree" TEXT,
  "semester" TEXT,
  "bio" TEXT,
  "country" TEXT,
  "timezone" TEXT,
  "language" TEXT NOT NULL DEFAULT 'English',
  "defaultAiModel" TEXT NOT NULL DEFAULT 'auto',
  "responseLength" TEXT NOT NULL DEFAULT 'balanced',
  "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "explanationLevel" TEXT NOT NULL DEFAULT 'detailed',
  "difficultyStyle" TEXT NOT NULL DEFAULT 'adaptive',
  "markdownOutput" BOOLEAN NOT NULL DEFAULT true,
  "codeOutput" BOOLEAN NOT NULL DEFAULT true,
  "studyMode" TEXT NOT NULL DEFAULT 'smart',
  "autoSaveHistory" BOOLEAN NOT NULL DEFAULT true,
  "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
  "weeklyReports" BOOLEAN NOT NULL DEFAULT true,
  "analysisCompletion" BOOLEAN NOT NULL DEFAULT true,
  "studyReminders" BOOLEAN NOT NULL DEFAULT false,
  "leaderboardUpdates" BOOLEAN NOT NULL DEFAULT true,
  "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
  "productUpdates" BOOLEAN NOT NULL DEFAULT false,
  "profileVisibility" TEXT NOT NULL DEFAULT 'private',
  "analyticsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "recommendationsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "activityVisibility" TEXT NOT NULL DEFAULT 'private',
  "recoveryEmail" TEXT,
  "recoveryPhone" TEXT,
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "lastPasswordChangeAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_userId_key" ON "user_settings"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_username_key" ON "user_settings"("username");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'user_settings_userId_fkey'
      AND table_name = 'user_settings'
  ) THEN
    ALTER TABLE "user_settings"
      ADD CONSTRAINT "user_settings_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
