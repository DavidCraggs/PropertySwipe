-- Migration: Create Renter Invites Table
-- Date: 2025-11-23
-- Description: Implements invite code system for landlords/agencies to pre-configure renter onboarding

-- Create renter_invites table
CREATE TABLE renter_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invite code
  code TEXT UNIQUE NOT NULL,
  
  -- Creator information
  created_by_id UUID NOT NULL,
  created_by_type TEXT NOT NULL CHECK (created_by_type IN ('landlord', 'management_agency', 'estate_agent')),
  
  -- Target configuration
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  managing_agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL,
  
  -- Tenancy pre-configuration
  proposed_rent_pcm INTEGER NOT NULL,
  proposed_deposit_amount INTEGER,
  proposed_move_in_date DATE,
  special_terms TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by_renter_id UUID REFERENCES renter_profiles(id) ON DELETE SET NULL,
  created_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  seed_tag TEXT
);

-- Create indexes for efficient queries
CREATE INDEX idx_renter_invites_code ON renter_invites(code) WHERE status = 'pending';
CREATE INDEX idx_renter_invites_property ON renter_invites(property_id) WHERE status = 'pending';
CREATE INDEX idx_renter_invites_landlord ON renter_invites(landlord_id);
CREATE INDEX idx_renter_invites_expires ON renter_invites(expires_at) WHERE status = 'pending';
CREATE INDEX idx_renter_invites_seed_tag ON renter_invites(seed_tag) WHERE seed_tag IS NOT NULL;

-- Function to auto-expire old invites
CREATE OR REPLACE FUNCTION expire_old_renter_invites()
RETURNS void AS $$
BEGIN
  UPDATE renter_invites
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add documentation comments
COMMENT ON TABLE renter_invites IS 'Invite codes for landlords/agencies to pre-configure renter onboarding with property links';
COMMENT ON COLUMN renter_invites.code IS '8-character alphanumeric invite code (e.g., AB12CD34)';
COMMENT ON COLUMN renter_invites.created_by_type IS 'Type of creator: landlord, management_agency, or estate_agent';
COMMENT ON COLUMN renter_invites.status IS 'Invite status: pending (unused), accepted (redeemed), expired, or revoked';
COMMENT ON COLUMN renter_invites.expires_at IS 'Expiry timestamp (default 30 days from creation)';
COMMENT ON COLUMN renter_invites.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
COMMENT ON FUNCTION expire_old_renter_invites() IS 'Updates all pending invites to expired status where expires_at < NOW()';
