-- =====================================================
-- Property-Level Conversations Migration
-- =====================================================
-- Modifies the agency_landlord_conversations table to support
-- property-specific conversation threads.
--
-- Created: 2026-01-08
-- =====================================================

-- Step 1: Remove existing unique constraint on agency_id + landlord_id
ALTER TABLE agency_landlord_conversations 
  DROP CONSTRAINT IF EXISTS agency_landlord_conversations_agency_id_landlord_id_key;

-- Step 2: Add new unique constraint: one conversation per agency-landlord-property combo
-- NULL property_id = general discussion thread
-- NULLS NOT DISTINCT ensures only one NULL property_id per agency-landlord pair
ALTER TABLE agency_landlord_conversations
  ADD CONSTRAINT alc_unique_conversation 
  UNIQUE NULLS NOT DISTINCT (agency_id, landlord_id, property_id);

-- Step 3: Add index for property-based queries
CREATE INDEX IF NOT EXISTS idx_alc_property_id 
  ON agency_landlord_conversations(property_id);

-- Step 4: Add compound index for efficient grouped queries
CREATE INDEX IF NOT EXISTS idx_alc_agency_landlord_property 
  ON agency_landlord_conversations(agency_id, landlord_id, property_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Property-level conversations migration completed successfully!';
    RAISE NOTICE '   - Removed old unique constraint (agency_id, landlord_id)';
    RAISE NOTICE '   - Added new unique constraint (agency_id, landlord_id, property_id)';
    RAISE NOTICE '   - Added property_id index for queries';
END $$;
