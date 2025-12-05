-- MIGRATION FIX NOTES
-- Date: 2025-12-01
-- Issue: Type mismatch between conversations and matches tables

/*
PROBLEM:
The initial migration defined conversations.match_id as UUID, but the matches table
uses TEXT for all ID columns. This caused a foreign key constraint error:
"operator does not exist: uuid = text"

SOLUTION:
Changed conversations table to use TEXT for both id and match_id columns:
- id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text
- match_id TEXT NOT NULL REFERENCES matches(id)

Also updated all helper functions to use TEXT instead of UUID:
- get_or_create_conversation(p_match_id TEXT) RETURNS TEXT
- mark_conversation_read(p_conversation_id TEXT)
- get_match_unread_counts(p_match_id TEXT)

This matches the PropertySwipe schema pattern where all IDs are TEXT, not UUID.
*/

-- To apply the fixed migration:
-- 1. Drop the incorrectly created table (if it exists):
DROP TABLE IF EXISTS conversations CASCADE;

-- 2. Run the corrected migration:
\i supabase/migrations/20251201_create_conversations_table.sql

-- 3. Then run the data migration:
\i supabase/migrations/20251201_migrate_existing_messages.sql
