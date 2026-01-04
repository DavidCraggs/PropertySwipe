-- ID Verification Tables for PropertySwipe
-- Phase 2: Right to Rent and PRS Registration Verification
-- Uses Stripe Identity - stores ONLY verification status, NO document data

-- =====================================================
-- VERIFICATION SESSIONS TABLE
-- Tracks verification attempts and their status
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('right_to_rent', 'prs_registration', 'income')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'expired')),
  stripe_session_id TEXT, -- Stripe Identity session ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB
);

CREATE INDEX idx_verification_sessions_user ON verification_sessions(user_id);
CREATE INDEX idx_verification_sessions_status ON verification_sessions(status);

-- =====================================================
-- USER VERIFICATIONS TABLE
-- Current verification status for each user
-- This is the source of truth for verification status
-- =====================================================

CREATE TABLE IF NOT EXISTS user_verifications (
  user_id TEXT PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('renter', 'landlord')),

  -- Right to Rent verification (renters)
  right_to_rent_status TEXT DEFAULT 'not_started' CHECK (right_to_rent_status IN ('not_started', 'pending', 'processing', 'verified', 'failed', 'expired')),
  right_to_rent_verified_at TIMESTAMPTZ,
  right_to_rent_expires_at TIMESTAMPTZ,
  right_to_rent_document_type TEXT CHECK (right_to_rent_document_type IN ('passport', 'driving_license', 'biometric_residence_permit', 'share_code', 'other')),
  last_verification_session_id TEXT REFERENCES verification_sessions(id),

  -- PRS Registration verification (landlords)
  prs_status TEXT DEFAULT 'not_started' CHECK (prs_status IN ('not_started', 'pending', 'verified', 'failed', 'expired')),
  prs_registration_number TEXT,
  prs_verified_at TIMESTAMPTZ,
  prs_expires_at TIMESTAMPTZ,

  -- Income verification (optional)
  income_status TEXT DEFAULT 'not_started' CHECK (income_status IN ('not_started', 'pending', 'verified', 'failed')),
  income_verified_at TIMESTAMPTZ,
  verified_monthly_amount DECIMAL(10,2),

  -- Revocation tracking (GDPR/fraud)
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ADD VERIFICATION COLUMNS TO RENTER_PROFILES
-- =====================================================

ALTER TABLE renter_profiles
ADD COLUMN IF NOT EXISTS right_to_rent_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE renter_profiles
ADD COLUMN IF NOT EXISTS right_to_rent_verified_at TIMESTAMPTZ;

ALTER TABLE renter_profiles
ADD COLUMN IF NOT EXISTS right_to_rent_expires_at TIMESTAMPTZ;

ALTER TABLE renter_profiles
ADD COLUMN IF NOT EXISTS right_to_rent_document_type TEXT CHECK (right_to_rent_document_type IN ('passport', 'driving_license', 'biometric_residence_permit', 'share_code', 'other'));

ALTER TABLE renter_profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_started' CHECK (verification_status IN ('not_started', 'pending', 'processing', 'verified', 'failed', 'expired'));

-- =====================================================
-- VERIFICATION AUDIT LOG
-- Immutable log of all verification events
-- Required for compliance and dispute resolution
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'session_created',
    'verification_started',
    'verification_completed',
    'verification_failed',
    'verification_expired',
    'verification_revoked',
    'document_submitted',
    'manual_review_requested'
  )),
  verification_type TEXT NOT NULL,
  session_id TEXT,
  details JSONB, -- Non-PII event details
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_audit_user ON verification_audit_log(user_id);
CREATE INDEX idx_verification_audit_type ON verification_audit_log(event_type);
CREATE INDEX idx_verification_audit_date ON verification_audit_log(created_at);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users can only see their own verification status
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification status" ON user_verifications
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own verification status" ON user_verifications
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "System can insert verification status" ON user_verifications
  FOR INSERT WITH CHECK (true);

-- Verification sessions are user-scoped
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON verification_sessions
  FOR SELECT USING (user_id = auth.uid()::text);

-- Audit log is append-only, visible only to admins
ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Note: Using permissive policy for now since admin_profiles table may not exist
-- In production, restrict to authenticated service role or specific admin users
CREATE POLICY "Only service role can view audit log" ON verification_audit_log
  FOR SELECT USING (auth.role() = 'service_role');

-- Allow authenticated users to insert audit entries (for logging verification events)
CREATE POLICY "Authenticated users can insert audit log" ON verification_audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if renter is verified
CREATE OR REPLACE FUNCTION is_renter_verified(renter_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM renter_profiles
    WHERE id = renter_id
    AND right_to_rent_verified = true
    AND right_to_rent_expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get renters with expiring verifications
CREATE OR REPLACE FUNCTION get_expiring_verifications(days_until_expiry INTEGER DEFAULT 30)
RETURNS TABLE (
  renter_id TEXT,
  email TEXT,
  expires_at TIMESTAMPTZ,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.email,
    r.right_to_rent_expires_at,
    EXTRACT(DAY FROM (r.right_to_rent_expires_at - NOW()))::INTEGER
  FROM renter_profiles r
  WHERE r.right_to_rent_verified = true
    AND r.right_to_rent_expires_at > NOW()
    AND r.right_to_rent_expires_at <= (NOW() + (days_until_expiry || ' days')::INTERVAL);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE verification_sessions IS 'Tracks ID verification attempts via Stripe Identity. No PII or document data stored.';
COMMENT ON TABLE user_verifications IS 'Current verification status for each user. Only stores pass/fail status and expiry dates.';
COMMENT ON TABLE verification_audit_log IS 'Immutable audit trail for all verification events. Required for compliance.';
COMMENT ON COLUMN user_verifications.right_to_rent_document_type IS 'Type of document used for verification. No document content stored.';
