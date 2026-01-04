-- =====================================================
-- Agency-Landlord Conversations Table Migration
-- =====================================================
-- Run this migration to add support for direct messaging
-- between agencies and landlords they manage.
--
-- Created: 2026-01-03
-- =====================================================

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS agency_landlord_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL, -- Optional property context
    messages JSONB DEFAULT '[]'::jsonb,
    last_message_at TIMESTAMPTZ,
    unread_count_agency INTEGER DEFAULT 0,
    unread_count_landlord INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, landlord_id) -- One conversation per agency-landlord pair
);

-- Enable RLS
ALTER TABLE agency_landlord_conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS agency_landlord_conversations_agency_policy ON agency_landlord_conversations;
DROP POLICY IF EXISTS agency_landlord_conversations_landlord_policy ON agency_landlord_conversations;

-- Agencies can view/manage their own conversations
CREATE POLICY agency_landlord_conversations_agency_policy ON agency_landlord_conversations
    FOR ALL USING (agency_id = auth.uid());

-- Landlords can view/manage their own conversations
CREATE POLICY agency_landlord_conversations_landlord_policy ON agency_landlord_conversations
    FOR ALL USING (landlord_id = auth.uid());

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_alc_agency_id ON agency_landlord_conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_alc_landlord_id ON agency_landlord_conversations(landlord_id);
CREATE INDEX IF NOT EXISTS idx_alc_last_message_at ON agency_landlord_conversations(last_message_at DESC);

-- Auto-update timestamp trigger (only if function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_agency_landlord_conversations_updated_at ON agency_landlord_conversations;
        CREATE TRIGGER update_agency_landlord_conversations_updated_at
            BEFORE UPDATE ON agency_landlord_conversations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Agency-Landlord Conversations table created successfully!';
END $$;
