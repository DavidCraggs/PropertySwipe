-- Two-Sided Matching System for PropertySwipe
-- Phase 3: Mutual matching between renters and landlords

-- =====================================================
-- INTERESTS TABLE
-- Tracks when a renter shows interest in a property
-- =====================================================

CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  renter_id TEXT NOT NULL,
  landlord_id TEXT NOT NULL,
  property_id TEXT NOT NULL,

  -- Interest details
  interested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Awaiting landlord review
    'landlord_liked',    -- Landlord approved - becomes a match
    'landlord_passed',   -- Landlord declined
    'expired',           -- Interest expired without action
    'withdrawn'          -- Renter withdrew interest
  )),

  -- Compatibility score (calculated at interest time)
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  compatibility_breakdown JSONB,

  -- Landlord action
  landlord_reviewed_at TIMESTAMPTZ,
  landlord_notes TEXT,

  -- Expiry (interests expire after 30 days if no action)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',

  -- If match was created from this interest
  created_match_id UUID,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate interests
  UNIQUE(renter_id, property_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- For landlord discovery page: show pending interests
CREATE INDEX idx_interests_landlord_pending
  ON interests(landlord_id, status)
  WHERE status = 'pending';

-- For renter to see their interests
CREATE INDEX idx_interests_renter
  ON interests(renter_id, status);

-- For property-specific interests
CREATE INDEX idx_interests_property
  ON interests(property_id, status);

-- For expiry cleanup job
CREATE INDEX idx_interests_expires
  ON interests(expires_at)
  WHERE status = 'pending';

-- For sorting by compatibility
CREATE INDEX idx_interests_compatibility
  ON interests(landlord_id, compatibility_score DESC)
  WHERE status = 'pending';

-- =====================================================
-- UPDATE MATCHES TABLE
-- Add reference to interest that created the match
-- =====================================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS source_interest_id UUID,
  ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'mutual'
    CHECK (match_type IN ('mutual', 'instant', 'legacy'));

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Create interest when renter swipes right
CREATE OR REPLACE FUNCTION create_interest(
  p_renter_id TEXT,
  p_property_id TEXT,
  p_landlord_id TEXT,
  p_compatibility_score INTEGER DEFAULT NULL,
  p_compatibility_breakdown JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_interest_id UUID;
BEGIN
  INSERT INTO interests (
    renter_id,
    landlord_id,
    property_id,
    compatibility_score,
    compatibility_breakdown
  ) VALUES (
    p_renter_id,
    p_landlord_id,
    p_property_id,
    p_compatibility_score,
    p_compatibility_breakdown
  )
  ON CONFLICT (renter_id, property_id)
  DO UPDATE SET
    status = 'pending',
    interested_at = NOW(),
    expires_at = NOW() + INTERVAL '30 days',
    updated_at = NOW()
  RETURNING id INTO v_interest_id;

  RETURN v_interest_id;
END;
$$ LANGUAGE plpgsql;

-- Landlord confirms interest (creates match)
CREATE OR REPLACE FUNCTION confirm_interest(
  p_interest_id UUID,
  p_landlord_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_interest RECORD;
  v_match_id UUID;
BEGIN
  -- Get interest details
  SELECT * INTO v_interest FROM interests WHERE id = p_interest_id;

  IF v_interest IS NULL THEN
    RAISE EXCEPTION 'Interest not found';
  END IF;

  IF v_interest.status != 'pending' THEN
    RAISE EXCEPTION 'Interest is not pending';
  END IF;

  -- Create the match
  INSERT INTO matches (
    renter_id,
    landlord_id,
    property_id,
    timestamp,
    application_status,
    tenancy_status,
    source_interest_id,
    match_type
  ) VALUES (
    v_interest.renter_id,
    v_interest.landlord_id,
    v_interest.property_id,
    NOW(),
    'pending',
    'prospective',
    p_interest_id,
    'mutual'
  )
  RETURNING id INTO v_match_id;

  -- Update interest status
  UPDATE interests
  SET
    status = 'landlord_liked',
    landlord_reviewed_at = NOW(),
    landlord_notes = p_landlord_notes,
    created_match_id = v_match_id,
    updated_at = NOW()
  WHERE id = p_interest_id;

  RETURN v_match_id;
END;
$$ LANGUAGE plpgsql;

-- Landlord declines interest
CREATE OR REPLACE FUNCTION decline_interest(
  p_interest_id UUID,
  p_landlord_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE interests
  SET
    status = 'landlord_passed',
    landlord_reviewed_at = NOW(),
    landlord_notes = p_landlord_notes,
    updated_at = NOW()
  WHERE id = p_interest_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interest not found or not pending';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Expire old interests (run as scheduled job)
CREATE OR REPLACE FUNCTION expire_stale_interests()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE interests
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'pending'
  AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Get pending interests for landlord with renter details
CREATE OR REPLACE FUNCTION get_landlord_pending_interests(
  p_landlord_id TEXT,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  interest_id UUID,
  renter_id TEXT,
  property_id TEXT,
  interested_at TIMESTAMPTZ,
  compatibility_score INTEGER,
  compatibility_breakdown JSONB,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.renter_id,
    i.property_id,
    i.interested_at,
    i.compatibility_score,
    i.compatibility_breakdown,
    i.expires_at
  FROM interests i
  WHERE i.landlord_id = p_landlord_id
  AND i.status = 'pending'
  ORDER BY i.compatibility_score DESC NULLS LAST, i.interested_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

-- Renters can view their own interests
CREATE POLICY "Renters can view own interests" ON interests
  FOR SELECT USING (renter_id = auth.uid()::text);

-- Landlords can view interests in their properties
CREATE POLICY "Landlords can view property interests" ON interests
  FOR SELECT USING (landlord_id = auth.uid()::text);

-- Renters can create interests
CREATE POLICY "Renters can create interests" ON interests
  FOR INSERT WITH CHECK (renter_id = auth.uid()::text);

-- Renters can withdraw their own interests
CREATE POLICY "Renters can withdraw interests" ON interests
  FOR UPDATE USING (
    renter_id = auth.uid()::text
    AND status = 'pending'
  );

-- Landlords can update interest status (approve/decline)
CREATE POLICY "Landlords can review interests" ON interests
  FOR UPDATE USING (
    landlord_id = auth.uid()::text
    AND status = 'pending'
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp on modification
CREATE OR REPLACE FUNCTION update_interests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interests_updated_at
  BEFORE UPDATE ON interests
  FOR EACH ROW
  EXECUTE FUNCTION update_interests_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE interests IS 'Tracks renter interest in properties for two-sided matching';
COMMENT ON COLUMN interests.compatibility_score IS 'Calculated compatibility score 0-100';
COMMENT ON COLUMN interests.compatibility_breakdown IS 'Detailed breakdown: affordability, timing, property_fit, etc.';
COMMENT ON COLUMN interests.created_match_id IS 'Reference to match created when landlord approves';
