-- Migration: Add Database-Level Constraints
-- This migration adds CHECK constraints for data integrity

-- =====================================================
-- Review Rating Constraint
-- =====================================================
-- Ensures rating values are always between 1 and 5 (inclusive)
-- This provides database-level validation in addition to application-level validation

ALTER TABLE "Review"
ADD CONSTRAINT "Review_rating_check"
CHECK (rating >= 1 AND rating <= 5);

-- =====================================================
-- Additional Recommended Constraints
-- =====================================================

-- Session duration must be positive
ALTER TABLE "Session"
ADD CONSTRAINT "Session_duration_positive"
CHECK (duration_minutes > 0);

-- Session max_participants must be at least 2 if specified
ALTER TABLE "Session"
ADD CONSTRAINT "Session_max_participants_min"
CHECK (max_participants IS NULL OR max_participants >= 2);

-- =====================================================
-- Index Recommendations (if not already created)
-- =====================================================
-- These indexes support common query patterns for better performance

-- Index for efficient notification queries by user and read status
CREATE INDEX IF NOT EXISTS "Notification_user_read_idx" ON "Notification" (user_id, read);

-- Index for efficient session queries by date and sport type
CREATE INDEX IF NOT EXISTS "Session_datetime_sport_idx" ON "Session" (date_time, sport_type);
