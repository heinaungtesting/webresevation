-- Add missing Waitlist table and other missing tables
-- Run this in Supabase SQL Editor

-- Create Waitlist table
CREATE TABLE IF NOT EXISTS "Waitlist" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "position" INTEGER,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Waitlist_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE CASCADE,
    CONSTRAINT "Waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Waitlist_session_id_user_id_key" UNIQUE ("session_id", "user_id")
);

-- Create indexes for Waitlist
CREATE INDEX IF NOT EXISTS "Waitlist_session_id_idx" ON "Waitlist"("session_id");
CREATE INDEX IF NOT EXISTS "Waitlist_user_id_idx" ON "Waitlist"("user_id");
CREATE INDEX IF NOT EXISTS "Waitlist_created_at_idx" ON "Waitlist"("created_at");

-- Create Favorite table if missing
CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Favorite_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE CASCADE,
    CONSTRAINT "Favorite_user_id_session_id_key" UNIQUE ("user_id", "session_id")
);

-- Create indexes for Favorite
CREATE INDEX IF NOT EXISTS "Favorite_user_id_idx" ON "Favorite"("user_id");
CREATE INDEX IF NOT EXISTS "Favorite_session_id_idx" ON "Favorite"("session_id");

-- Create Review table if missing
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Review_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE CASCADE,
    CONSTRAINT "Review_user_id_session_id_key" UNIQUE ("user_id", "session_id"),
    CONSTRAINT "Review_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- Create indexes for Review
CREATE INDEX IF NOT EXISTS "Review_user_id_idx" ON "Review"("user_id");
CREATE INDEX IF NOT EXISTS "Review_session_id_idx" ON "Review"("session_id");
CREATE INDEX IF NOT EXISTS "Review_rating_idx" ON "Review"("rating");

-- Create Notification table if missing
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for Notification
CREATE INDEX IF NOT EXISTS "Notification_user_id_idx" ON "Notification"("user_id");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
CREATE INDEX IF NOT EXISTS "Notification_created_at_idx" ON "Notification"("created_at");

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Waitlist', 'Favorite', 'Review', 'Notification')
ORDER BY table_name;
