-- Add missing UserSession table columns
-- Run this in Supabase SQL Editor

-- Create AttendanceStatus enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceStatus') THEN
        CREATE TYPE "AttendanceStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'NO_SHOW');
    END IF;
END $$;

-- Add status column
ALTER TABLE "UserSession" 
ADD COLUMN IF NOT EXISTS "status" "AttendanceStatus" NOT NULL DEFAULT 'REGISTERED';

-- Add marked_at column (when user registered)
ALTER TABLE "UserSession"
ADD COLUMN IF NOT EXISTS "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add attended_at column (when attendance was marked - nullable)
ALTER TABLE "UserSession"
ADD COLUMN IF NOT EXISTS "attended_at" TIMESTAMP(3);

-- Create index on status
CREATE INDEX IF NOT EXISTS "UserSession_status_idx" ON "UserSession"("status");

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'UserSession' 
AND column_name IN ('status', 'marked_at', 'attended_at')
ORDER BY column_name;
