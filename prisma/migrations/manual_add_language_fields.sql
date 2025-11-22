-- Complete manual migration to add ALL missing Session fields
-- Run this in Supabase SQL Editor if prisma db push hangs

-- Add primary_language column
ALTER TABLE "Session" 
ADD COLUMN IF NOT EXISTS "primary_language" TEXT NOT NULL DEFAULT 'ja';

-- Add allow_english column  
ALTER TABLE "Session"
ADD COLUMN IF NOT EXISTS "allow_english" BOOLEAN NOT NULL DEFAULT false;

-- Add vibe column (enum type)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionVibe') THEN
        CREATE TYPE "SessionVibe" AS ENUM ('COMPETITIVE', 'CASUAL', 'ACADEMY', 'LANGUAGE_EXCHANGE');
    END IF;
END $$;

ALTER TABLE "Session"
ADD COLUMN IF NOT EXISTS "vibe" "SessionVibe" NOT NULL DEFAULT 'CASUAL';

-- Add attendance_marked column
ALTER TABLE "Session"
ADD COLUMN IF NOT EXISTS "attendance_marked" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "Session_primary_language_idx" ON "Session"("primary_language");
CREATE INDEX IF NOT EXISTS "Session_allow_english_idx" ON "Session"("allow_english");
CREATE INDEX IF NOT EXISTS "Session_vibe_idx" ON "Session"("vibe");

-- Verify all columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Session' 
AND column_name IN ('primary_language', 'allow_english', 'vibe', 'attendance_marked')
ORDER BY column_name;
