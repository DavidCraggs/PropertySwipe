-- =====================================================
-- RRA 2025 COMPLIANCE UPDATES
-- Adds Right to Rent and Pet Request tracking to Matches
-- =====================================================

-- 1. Add Right to Rent verification to matches
-- This is a mandatory check for landlords in England
ALTER TABLE matches 
ADD COLUMN right_to_rent_verified_at TIMESTAMPTZ;

-- 2. Add Pet Request tracking
-- Tenants have a right to request a pet, and landlords must provide a reasonable reason for refusal
ALTER TABLE matches 
ADD COLUMN pet_request_status TEXT DEFAULT 'none' CHECK (pet_request_status IN ('none', 'requested', 'approved', 'refused')),
ADD COLUMN pet_refusal_reason TEXT;

-- 3. Add index for querying pending pet requests
CREATE INDEX idx_matches_pet_request ON matches(pet_request_status) WHERE pet_request_status = 'requested';

COMMENT ON COLUMN matches.right_to_rent_verified_at IS 'When the landlord verified the tenant''s Right to Rent (Immigration Act 2014)';
COMMENT ON COLUMN matches.pet_request_status IS 'Status of a request to keep a pet (RRA 2025)';
COMMENT ON COLUMN matches.pet_refusal_reason IS 'Reasonable ground for refusing a pet request (required if refused)';
