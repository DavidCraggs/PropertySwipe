-- Migration: Migrate Existing Messages to Conversations Table
-- Date: 2025-12-01
-- Description: Migrates existing messages from matches.messages to the conversations table
-- IMPORTANT: Backup your database before running this migration!

-- =====================================================
-- STEP 1: MIGRATE EXISTING MESSAGES TO LANDLORD CONVERSATIONS
-- =====================================================

-- Create landlord conversations for all matches with existing messages
INSERT INTO conversations (
  match_id, 
  conversation_type, 
  messages, 
  last_message_at, 
  unread_count_renter, 
  unread_count_other,
  seed_tag
)
SELECT 
  id as match_id,
  'landlord' as conversation_type,
  -- Convert JSONB[] array to JSONB
  COALESCE(
    to_jsonb(messages),
    '[]'::jsonb
  ) as messages,
  last_message_at,
  -- Migrate unread count to renter's unread count (assuming most unreads are for renters)
  COALESCE(unread_count, 0) as unread_count_renter,
  0 as unread_count_other,
  seed_tag
FROM matches
WHERE messages IS NOT NULL
ON CONFLICT (match_id, conversation_type) DO NOTHING;

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM conversations
  WHERE conversation_type = 'landlord';
  
  RAISE NOTICE 'Migrated % landlord conversations', migrated_count;
END $$;

-- =====================================================
-- STEP 2: CREATE EMPTY AGENCY CONVERSATIONS
-- =====================================================

-- Create empty agency conversations for matches with managing agencies
INSERT INTO conversations (
  match_id, 
  conversation_type, 
  messages,
  seed_tag
)
SELECT DISTINCT
  id as match_id,
  'agency' as conversation_type,
  '[]'::jsonb as messages,
  seed_tag
FROM matches
WHERE managing_agency_id IS NOT NULL
ON CONFLICT (match_id, conversation_type) DO NOTHING;

-- Log agency conversation creation
DO $$
DECLARE
  agency_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO agency_count
  FROM conversations
  WHERE conversation_type = 'agency';
  
  RAISE NOTICE 'Created % agency conversations', agency_count;
END $$;

-- =====================================================
-- STEP 3: VERIFY MIGRATION
-- =====================================================

-- Verify no messages were lost
DO $$
DECLARE
  matches_with_messages INTEGER;
  landlord_conversations INTEGER;
BEGIN
  SELECT COUNT(*) INTO matches_with_messages
  FROM matches
  WHERE messages IS NOT NULL 
    AND array_length(messages, 1) > 0;
  
  SELECT COUNT(*) INTO landlord_conversations
  FROM conversations
  WHERE conversation_type = 'landlord'
    AND messages IS NOT NULL
    AND jsonb_array_length(messages) > 0;
  
  IF matches_with_messages != landlord_conversations THEN
    RAISE WARNING 'Message count mismatch: % matches with messages, but % landlord conversations', 
      matches_with_messages, landlord_conversations;
  ELSE
    RAISE NOTICE 'Migration verified: all % messages migrated successfully', landlord_conversations;
  END IF;
END $$;

-- =====================================================
-- STEP 4: ADD DEPRECATION COMMENTS (OPTIONAL)
-- =====================================================

-- Mark old fields as deprecated (but don't remove them yet for backward compatibility)
COMMENT ON COLUMN matches.messages IS 
  'DEPRECATED: Use conversations table instead. Kept for backward compatibility during transition period.';

COMMENT ON COLUMN matches.unread_count IS 
  'DEPRECATED: Use conversations.unread_count_renter/unread_count_other instead. Kept for backward compatibility.';

COMMENT ON COLUMN matches.last_message_at IS 
  'DEPRECATED: Use conversations.last_message_at instead. Kept for backward compatibility.';

-- =====================================================
-- STEP 5: CREATE SUMMARY VIEW (OPTIONAL)
-- =====================================================

-- Create a view to easily see conversation statistics
CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
  c.id as conversation_id,
  c.match_id,
  c.conversation_type,
  m.property_id,
  m.renter_id,
  m.landlord_id,
  m.managing_agency_id,
  jsonb_array_length(c.messages) as message_count,
  c.last_message_at,
  c.unread_count_renter,
  c.unread_count_other,
  c.created_at,
  c.updated_at
FROM conversations c
JOIN matches m ON c.match_id = m.id
ORDER BY c.last_message_at DESC NULLS LAST;

COMMENT ON VIEW conversation_summary IS 
  'Convenient view showing conversation statistics with match context';

-- =====================================================
-- ROLLBACK SCRIPT (For reference - store separately if needed)
-- =====================================================

/*
-- To rollback this migration:

-- 1. Restore messages back to matches table
UPDATE matches m
SET 
  messages = c.messages,
  last_message_at = c.last_message_at,
  unread_count = c.unread_count_renter
FROM conversations c
WHERE m.id = c.match_id
  AND c.conversation_type = 'landlord';

-- 2. Drop the conversations table
DROP TABLE IF EXISTS conversations CASCADE;

-- 3. Drop the view
DROP VIEW IF EXISTS conversation_summary;

-- 4. Remove deprecation comments
COMMENT ON COLUMN matches.messages IS NULL;
COMMENT ON COLUMN matches.unread_count IS NULL;
COMMENT ON COLUMN matches.last_message_at IS NULL;
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

RAISE NOTICE 'Message migration completed successfully. Review the logs above for details.';
