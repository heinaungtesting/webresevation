-- Add missing enums
CREATE TYPE "LanguageLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'NATIVE');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
CREATE TYPE "ReportReason" AS ENUM ('HARASSMENT', 'NO_SHOW', 'SPAM', 'CREEPY_BEHAVIOR', 'FAKE_PROFILE', 'OTHER');
CREATE TYPE "ReportEntityType" AS ENUM ('USER', 'SESSION');

-- Add missing columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "native_language" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "target_language" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language_level" "LanguageLevel";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_verified_student" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_banned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banned_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banned_reason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "no_show_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "reliability_score" INTEGER NOT NULL DEFAULT 100;

-- Create missing indexes on User table
CREATE INDEX IF NOT EXISTS "User_reliability_score_idx" ON "User"("reliability_score");
CREATE INDEX IF NOT EXISTS "User_is_banned_idx" ON "User"("is_banned");

-- Create missing indexes on Session table
CREATE INDEX IF NOT EXISTS "Session_date_time_sport_type_idx" ON "Session"("date_time", "sport_type");
CREATE INDEX IF NOT EXISTS "Session_date_time_sport_center_id_idx" ON "Session"("date_time", "sport_center_id");
CREATE INDEX IF NOT EXISTS "Session_sport_type_skill_level_date_time_idx" ON "Session"("sport_type", "skill_level", "date_time");

-- Create Report table
CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "entity_type" "ReportEntityType" NOT NULL,
    "reported_user_id" TEXT,
    "session_id" TEXT,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Report table
CREATE INDEX IF NOT EXISTS "Report_reporter_id_idx" ON "Report"("reporter_id");
CREATE INDEX IF NOT EXISTS "Report_reported_user_id_idx" ON "Report"("reported_user_id");
CREATE INDEX IF NOT EXISTS "Report_session_id_idx" ON "Report"("session_id");
CREATE INDEX IF NOT EXISTS "Report_status_idx" ON "Report"("status");
CREATE INDEX IF NOT EXISTS "Report_created_at_idx" ON "Report"("created_at");
CREATE INDEX IF NOT EXISTS "Report_entity_type_idx" ON "Report"("entity_type");

-- Add foreign keys for Report table
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add missing indexes on Notification table
CREATE INDEX IF NOT EXISTS "Notification_user_id_read_created_at_idx" ON "Notification"("user_id", "read", "created_at" DESC);
