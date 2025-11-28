-- Optimize RLS Policies for Performance
-- This migration addresses two main performance issues:
-- 1. Wraps auth.uid() calls with (select auth.uid()) to prevent re-evaluation for each row
-- 2. Consolidates duplicate permissive policies into single policies

-- ============================================
-- USER TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own data" ON "User";
DROP POLICY IF EXISTS "Users can insert their own data" ON "User";
DROP POLICY IF EXISTS "Users can view all profiles" ON "User";

-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies
CREATE POLICY "Users can view all profiles" ON "User"
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own data" ON "User"
  FOR INSERT
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update their own data" ON "User"
  FOR UPDATE
  USING (id = (select auth.uid()));

-- ============================================
-- NOTIFICATION TABLE
-- ============================================

-- Drop existing policies (including duplicates)
DROP POLICY IF EXISTS "Users can read their own notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can view their notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can update their own notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can update their notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can delete their own notifications" ON "Notification";

-- Enable RLS
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies (consolidated)
CREATE POLICY "Users can manage their notifications" ON "Notification"
  FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their notifications" ON "Notification"
  FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their notifications" ON "Notification"
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================
-- CONVERSATION TABLE
-- ============================================

-- Drop existing policies (including duplicates)
DROP POLICY IF EXISTS "Users can read their conversations" ON "Conversation";
DROP POLICY IF EXISTS "Users can view their conversations" ON "Conversation";
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON "Conversation";
DROP POLICY IF EXISTS "Participants can update conversations" ON "Conversation";

-- Enable RLS
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies (consolidated)
CREATE POLICY "Users can view their conversations" ON "Conversation"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant"
      WHERE "ConversationParticipant".conversation_id = "Conversation".id
      AND "ConversationParticipant".user_id = (select auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create conversations" ON "Conversation"
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Participants can update conversations" ON "Conversation"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant"
      WHERE "ConversationParticipant".conversation_id = "Conversation".id
      AND "ConversationParticipant".user_id = (select auth.uid())
    )
  );

-- ============================================
-- CONVERSATION PARTICIPANT TABLE
-- ============================================

-- Drop existing policies (including duplicates)
DROP POLICY IF EXISTS "Users can read participants of their conversations" ON "ConversationParticipant";
DROP POLICY IF EXISTS "Users can view conversation participants" ON "ConversationParticipant";
DROP POLICY IF EXISTS "Users can join conversations" ON "ConversationParticipant";
DROP POLICY IF EXISTS "Users can leave conversations" ON "ConversationParticipant";
DROP POLICY IF EXISTS "Users can update their own participation" ON "ConversationParticipant";

-- Enable RLS
ALTER TABLE "ConversationParticipant" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies (consolidated)
CREATE POLICY "Users can view conversation participants" ON "ConversationParticipant"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant" cp
      WHERE cp.conversation_id = "ConversationParticipant".conversation_id
      AND cp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can join conversations" ON "ConversationParticipant"
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their participation" ON "ConversationParticipant"
  FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can leave conversations" ON "ConversationParticipant"
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================
-- MESSAGE TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read messages from their conversations" ON "Message";
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON "Message";
DROP POLICY IF EXISTS "Users can update their own messages" ON "Message";
DROP POLICY IF EXISTS "Users can delete their own messages" ON "Message";

-- Enable RLS
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies
CREATE POLICY "Users can read messages from their conversations" ON "Message"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant"
      WHERE "ConversationParticipant".conversation_id = "Message".conversation_id
      AND "ConversationParticipant".user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON "Message"
  FOR INSERT
  WITH CHECK (
    sender_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM "ConversationParticipant"
      WHERE "ConversationParticipant".conversation_id = "Message".conversation_id
      AND "ConversationParticipant".user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON "Message"
  FOR UPDATE
  USING (sender_id = (select auth.uid()));

CREATE POLICY "Users can delete their own messages" ON "Message"
  FOR DELETE
  USING (sender_id = (select auth.uid()));

-- ============================================
-- SESSION TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all sessions" ON "Session";
DROP POLICY IF EXISTS "Users can create sessions" ON "Session";
DROP POLICY IF EXISTS "Session creators can update their sessions" ON "Session";
DROP POLICY IF EXISTS "Session creators can delete their sessions" ON "Session";

-- Enable RLS
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies
CREATE POLICY "Users can view all sessions" ON "Session"
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create sessions" ON "Session"
  FOR INSERT
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Session creators can update their sessions" ON "Session"
  FOR UPDATE
  USING (created_by = (select auth.uid()));

CREATE POLICY "Session creators can delete their sessions" ON "Session"
  FOR DELETE
  USING (created_by = (select auth.uid()));

-- ============================================
-- USER SESSION TABLE
-- ============================================

-- Drop existing policies (including duplicates)
DROP POLICY IF EXISTS "Users can view their own session registrations" ON "UserSession";
DROP POLICY IF EXISTS "Session creators can view registrations" ON "UserSession";
DROP POLICY IF EXISTS "Users can register for sessions" ON "UserSession";
DROP POLICY IF EXISTS "Session creators can update attendance" ON "UserSession";
DROP POLICY IF EXISTS "Users can cancel their registrations" ON "UserSession";

-- Enable RLS
ALTER TABLE "UserSession" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies (consolidated)
CREATE POLICY "Users can view session registrations" ON "UserSession"
  FOR SELECT
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM "Session"
      WHERE "Session".id = "UserSession".session_id
      AND "Session".created_by = (select auth.uid())
    )
  );

CREATE POLICY "Users can register for sessions" ON "UserSession"
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Session creators can update attendance" ON "UserSession"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "Session"
      WHERE "Session".id = "UserSession".session_id
      AND "Session".created_by = (select auth.uid())
    )
  );

CREATE POLICY "Users can cancel their registrations" ON "UserSession"
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================
-- FAVORITE TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their favorites" ON "Favorite";
DROP POLICY IF EXISTS "Users can add favorites" ON "Favorite";
DROP POLICY IF EXISTS "Users can remove favorites" ON "Favorite";

-- Enable RLS
ALTER TABLE "Favorite" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies
CREATE POLICY "Users can view their favorites" ON "Favorite"
  FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can add favorites" ON "Favorite"
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can remove favorites" ON "Favorite"
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================
-- REVIEW TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all reviews" ON "Review";
DROP POLICY IF EXISTS "Users can create reviews" ON "Review";
DROP POLICY IF EXISTS "Users can update their reviews" ON "Review";
DROP POLICY IF EXISTS "Users can delete their reviews" ON "Review";

-- Enable RLS
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies
CREATE POLICY "Users can view all reviews" ON "Review"
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews" ON "Review"
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their reviews" ON "Review"
  FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their reviews" ON "Review"
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================
-- REPORT TABLE
-- ============================================

-- Drop existing policies (including duplicates)
DROP POLICY IF EXISTS "Users can view their submitted reports" ON "Report";
DROP POLICY IF EXISTS "Admins can view all reports" ON "Report";
DROP POLICY IF EXISTS "Users can create reports" ON "Report";
DROP POLICY IF EXISTS "Admins can update reports" ON "Report";

-- Enable RLS
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies (consolidated)
CREATE POLICY "Users can view reports" ON "Report"
  FOR SELECT
  USING (
    reporter_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = (select auth.uid())
      AND "User".is_admin = true
    )
  );

CREATE POLICY "Users can create reports" ON "Report"
  FOR INSERT
  WITH CHECK (reporter_id = (select auth.uid()));

CREATE POLICY "Admins can update reports" ON "Report"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = (select auth.uid())
      AND "User".is_admin = true
    )
  );

-- ============================================
-- WAITLIST TABLE
-- ============================================

-- Drop existing policies (including duplicates)
DROP POLICY IF EXISTS "Users can view their waitlist entries" ON "Waitlist";
DROP POLICY IF EXISTS "Session creators can view session waitlist" ON "Waitlist";
DROP POLICY IF EXISTS "Users can join waitlists" ON "Waitlist";
DROP POLICY IF EXISTS "Users can leave waitlists" ON "Waitlist";

-- Enable RLS
ALTER TABLE "Waitlist" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies (consolidated)
CREATE POLICY "Users can view waitlist entries" ON "Waitlist"
  FOR SELECT
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM "Session"
      WHERE "Session".id = "Waitlist".session_id
      AND "Session".created_by = (select auth.uid())
    )
  );

CREATE POLICY "Users can join waitlists" ON "Waitlist"
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can leave waitlists" ON "Waitlist"
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ============================================
-- SPORT CENTER TABLE
-- ============================================

-- Drop existing policies (including duplicates)
DROP POLICY IF EXISTS "Users can view sport centers" ON "SportCenter";
DROP POLICY IF EXISTS "Admins can manage sport centers" ON "SportCenter";

-- Enable RLS
ALTER TABLE "SportCenter" ENABLE ROW LEVEL SECURITY;

-- Recreate optimized policies (consolidated)
CREATE POLICY "Anyone can view sport centers" ON "SportCenter"
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sport centers" ON "SportCenter"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = (select auth.uid())
      AND "User".is_admin = true
    )
  );
