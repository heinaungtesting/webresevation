-- Add missing Conversation, ConversationParticipant, and Message tables
-- Run this in Supabase SQL Editor

-- Create Conversation table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL DEFAULT 'direct',
    "session_id" TEXT UNIQUE,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3),
    CONSTRAINT "Conversation_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE CASCADE
);

-- Create ConversationParticipant table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP(3),
    CONSTRAINT "ConversationParticipant_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE CASCADE,
    CONSTRAINT "ConversationParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "ConversationParticipant_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id")
);

-- Create Message table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE CASCADE,
    CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for Conversation
CREATE INDEX IF NOT EXISTS "Conversation_session_id_idx" ON "Conversation"("session_id");
CREATE INDEX IF NOT EXISTS "Conversation_last_message_at_idx" ON "Conversation"("last_message_at");

-- Create indexes for ConversationParticipant
CREATE INDEX IF NOT EXISTS "ConversationParticipant_conversation_id_idx" ON "ConversationParticipant"("conversation_id");
CREATE INDEX IF NOT EXISTS "ConversationParticipant_user_id_idx" ON "ConversationParticipant"("user_id");

-- Create indexes for Message
CREATE INDEX IF NOT EXISTS "Message_conversation_id_idx" ON "Message"("conversation_id");
CREATE INDEX IF NOT EXISTS "Message_sender_id_idx" ON "Message"("sender_id");
CREATE INDEX IF NOT EXISTS "Message_created_at_idx" ON "Message"("created_at");

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Conversation', 'ConversationParticipant', 'Message')
ORDER BY table_name;
