-- Migration: Create Conversations Table for Dual Messaging System
-- Date: 2025-12-01
-- Description: Creates separate conversation threads for landlord and agency communications

-- =====================================================
-- CREATE CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('landlord', 'agency')),
  
  -- Message storage (JSONB array for compatibility with existing structure)
  messages JSONB DEFAULT '[]'::jsonb,
  last_message_at TIMESTAMPTZ,
  
  -- Unread counts (bidirectional tracking)
  unread_count_renter INTEGER DEFAULT 0 CHECK (unread_count_renter >= 0),
  unread_count_other INTEGER DEFAULT 0 CHECK (unread_count_other >= 0),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Seed tag for test data cleanup
  seed_tag TEXT,
  
  -- Constraints
  UNIQUE(match_id, conversation_type) -- Only one landlord and one agency conversation per match
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary lookup by match
CREATE INDEX IF NOT EXISTS idx_conversations_match ON conversations(match_id);

-- Filter by conversation type
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);

-- Sort by recent activity
CREATE INDEX IF NOT EXISTS idx_conversations_last_message 
  ON conversations(last_message_at DESC NULLS LAST) 
  WHERE last_message_at IS NOT NULL;

-- Find conversations with unread messages
CREATE INDEX IF NOT EXISTS idx_conversations_unread 
  ON conversations(match_id, conversation_type) 
  WHERE unread_count_renter > 0 OR unread_count_other > 0;

-- Seed tag cleanup
CREATE INDEX IF NOT EXISTS idx_conversations_seed_tag 
  ON conversations(seed_tag) 
  WHERE seed_tag IS NOT NULL;

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_conversations_match_type 
  ON conversations(match_id, conversation_type);

-- =====================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversations_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations for their own matches
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
      AND (
        matches.renter_id = auth.uid()
        OR matches.landlord_id = auth.uid()
        OR (conversation_type = 'agency' AND matches.managing_agency_id = auth.uid())
      )
    )
  );

-- Users can insert conversations for their own matches
CREATE POLICY "Users can create conversations for their matches"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
      AND (
        matches.renter_id = auth.uid()
        OR matches.landlord_id = auth.uid()
        OR (conversation_type = 'agency' AND matches.managing_agency_id = auth.uid())
      )
    )
  );

-- Users can update conversations for their own matches
CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
      AND (
        matches.renter_id = auth.uid()
        OR matches.landlord_id = auth.uid()
        OR (conversation_type = 'agency' AND matches.managing_agency_id = auth.uid())
      )
    )
  );

-- Users can delete conversations for their own matches (admin functionality)
CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
      AND (
        matches.renter_id = auth.uid()
        OR matches.landlord_id = auth.uid()
      )
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get conversation by match and type, creating if it doesn't exist
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_match_id UUID,
  p_conversation_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to get existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE match_id = p_match_id
    AND conversation_type = p_conversation_type;
  
  -- If not found, create it
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (match_id, conversation_type)
    VALUES (p_match_id, p_conversation_type)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID,
  p_user_role TEXT -- 'renter' or 'other'
)
RETURNS VOID AS $$
BEGIN
  IF p_user_role = 'renter' THEN
    UPDATE conversations
    SET unread_count_renter = 0,
        updated_at = NOW()
    WHERE id = p_conversation_id;
  ELSE
    UPDATE conversations
    SET unread_count_other = 0,
        updated_at = NOW()
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread counts for a match
CREATE OR REPLACE FUNCTION get_match_unread_counts(p_match_id UUID)
RETURNS TABLE(
  landlord_unread INTEGER,
  agency_unread INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT unread_count_renter FROM conversations 
       WHERE match_id = p_match_id AND conversation_type = 'landlord'),
      0
    ) as landlord_unread,
    COALESCE(
      (SELECT unread_count_renter FROM conversations 
       WHERE match_id = p_match_id AND conversation_type = 'agency'),
      0
    ) as agency_unread;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE conversations IS 
  'Separate conversation threads for landlord and agency communications per match. Part of dual-conversation messaging system.';

COMMENT ON COLUMN conversations.conversation_type IS 
  'Type of conversation: landlord (contract/legal) or agency (day-to-day management)';

COMMENT ON COLUMN conversations.unread_count_renter IS 
  'Number of unread messages for the renter in this conversation';

COMMENT ON COLUMN conversations.unread_count_other IS 
  'Number of unread messages for the other party (landlord or agency) in this conversation';

COMMENT ON COLUMN conversations.seed_tag IS 
  'Tag for identifying test/seed data for easy cleanup';

COMMENT ON FUNCTION get_or_create_conversation IS 
  'Retrieves existing conversation or creates a new one if it doesn''t exist';

COMMENT ON FUNCTION mark_conversation_read IS 
  'Marks a conversation as read for the specified user role (renter or other)';

COMMENT ON FUNCTION get_match_unread_counts IS 
  'Returns unread message counts for both landlord and agency conversations for a given match';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations'
  ) THEN
    RAISE NOTICE 'Conversations table created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create conversations table';
  END IF;
END $$;
