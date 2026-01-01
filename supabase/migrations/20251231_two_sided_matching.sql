-- Two-Sided Matching System Migration
-- Implements Phase 3 from World-Class Implementation Plan

-- =====================================================
-- INTERESTS TABLE
-- Tracks renter interest in properties before landlord confirmation
-- =====================================================

CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  renter_id TEXT NOT NULL,
  landlord_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  interested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'landlord_liked', 'landlord_passed', 'expired', 'matched')) DEFAULT 'pending',
  landlord_reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  created_match_id UUID,

  -- Compatibility scoring (cached for performance)
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  compatibility_breakdown JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique interest per renter-property pair
  UNIQUE(renter_id, property_id)
);

-- Add foreign key references (non-enforced for flexibility with current storage)
-- REFERENCES renter_profiles(id) ON DELETE CASCADE
-- REFERENCES landlord_profiles(id) ON DELETE CASCADE
-- REFERENCES properties(id) ON DELETE CASCADE
-- REFERENCES matches(id) ON DELETE SET NULL

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for landlords viewing pending interests
CREATE INDEX IF NOT EXISTS idx_interests_landlord_pending
  ON interests(landlord_id, status)
  WHERE status = 'pending';

-- Index for renters checking their interest status
CREATE INDEX IF NOT EXISTS idx_interests_renter
  ON interests(renter_id, status);

-- Index for expiry cleanup job
CREATE INDEX IF NOT EXISTS idx_interests_expires
  ON interests(expires_at)
  WHERE status = 'pending';

-- Index for property-based lookups
CREATE INDEX IF NOT EXISTS idx_interests_property
  ON interests(property_id, status);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_interests_updated_at ON interests;
CREATE TRIGGER trigger_interests_updated_at
  BEFORE UPDATE ON interests
  FOR EACH ROW
  EXECUTE FUNCTION update_interests_updated_at();

-- Function to expire stale interests
CREATE OR REPLACE FUNCTION expire_stale_interests()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE interests
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

-- Renters can view their own interests
CREATE POLICY interests_renter_select ON interests
  FOR SELECT
  USING (renter_id = current_user_id());

-- Landlords can view interests in their properties
CREATE POLICY interests_landlord_select ON interests
  FOR SELECT
  USING (landlord_id = current_user_id());

-- Renters can insert interests
CREATE POLICY interests_renter_insert ON interests
  FOR INSERT
  WITH CHECK (renter_id = current_user_id());

-- Landlords can update interest status
CREATE POLICY interests_landlord_update ON interests
  FOR UPDATE
  USING (landlord_id = current_user_id())
  WITH CHECK (landlord_id = current_user_id());

-- =====================================================
-- VIEWS
-- =====================================================

-- View for landlords showing pending interests with renter info
CREATE OR REPLACE VIEW v_landlord_pending_interests AS
SELECT
  i.id AS interest_id,
  i.renter_id,
  i.landlord_id,
  i.property_id,
  i.interested_at,
  i.compatibility_score,
  i.compatibility_breakdown,
  i.expires_at,
  i.status
FROM interests i
WHERE i.status = 'pending';

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE interests IS 'Tracks renter interest in properties for two-sided matching system';
COMMENT ON COLUMN interests.status IS 'pending = awaiting landlord review, landlord_liked = landlord interested, landlord_passed = landlord declined, expired = interest expired, matched = converted to match';
COMMENT ON COLUMN interests.compatibility_score IS 'Cached compatibility score (0-100) for quick sorting';
COMMENT ON COLUMN interests.compatibility_breakdown IS 'JSON breakdown of compatibility factors for UI display';
