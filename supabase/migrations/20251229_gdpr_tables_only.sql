-- =====================================================
-- GDPR Tables Only Migration
-- =====================================================
-- This migration creates only the new GDPR tables without
-- modifying existing foreign key constraints.
-- Created: 2025-12-29
-- =====================================================

BEGIN;

-- =====================================================
-- DELETION REQUEST TRACKING TABLE
-- =====================================================
-- Tracks GDPR deletion requests per Article 17

CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('renter', 'landlord', 'estate_agent', 'management_agency', 'admin')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  scheduled_deletion_date TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'executed', 'cancelled', 'failed')),
  reason TEXT,
  verification_token TEXT UNIQUE NOT NULL,
  cancellation_token TEXT UNIQUE,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_scheduled_date ON deletion_requests(scheduled_deletion_date);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_verification_token ON deletion_requests(verification_token);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_cancellation_token ON deletion_requests(cancellation_token);

-- =====================================================
-- ROW LEVEL SECURITY FOR DELETION REQUESTS
-- =====================================================

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can only view their own deletion requests
CREATE POLICY deletion_requests_select_policy ON deletion_requests
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only create deletion requests for themselves
CREATE POLICY deletion_requests_insert_policy ON deletion_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only the system (via service role) can update deletion requests
CREATE POLICY deletion_requests_update_policy ON deletion_requests
  FOR UPDATE
  USING (false); -- No user updates allowed

-- Only the system (via service role) can delete deletion requests
CREATE POLICY deletion_requests_delete_policy ON deletion_requests
  FOR DELETE
  USING (false); -- No user deletes allowed

-- =====================================================
-- AUDIT LOG TABLE FOR GDPR COMPLIANCE
-- =====================================================
-- Track all data access and deletion operations per Article 30

CREATE TABLE IF NOT EXISTS gdpr_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_type TEXT CHECK (user_type IN ('renter', 'landlord', 'estate_agent', 'management_agency', 'admin')),
  operation TEXT NOT NULL CHECK (operation IN ('data_export', 'data_deletion', 'data_anonymization', 'consent_update')),
  table_name TEXT,
  record_id UUID,
  details JSONB,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by UUID, -- Admin user who performed the action
  ip_address INET,
  user_agent TEXT
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_user_id ON gdpr_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_operation ON gdpr_audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_log_performed_at ON gdpr_audit_log(performed_at);

-- RLS for audit log (read-only for users, write for system)
ALTER TABLE gdpr_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY gdpr_audit_log_select_policy ON gdpr_audit_log
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY gdpr_audit_log_insert_policy ON gdpr_audit_log
  FOR INSERT
  WITH CHECK (true); -- System can always insert

-- =====================================================
-- CONSENT RECORDS TABLE
-- =====================================================
-- Track user consent per GDPR Article 7

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('essential', 'functional', 'analytics', 'marketing', 'personalization', 'third_party_sharing')),
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  consent_method TEXT NOT NULL CHECK (consent_method IN ('explicit', 'implicit', 'opt_in', 'opt_out')),
  consent_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for consent queries
CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_purpose ON consent_records(purpose);
CREATE INDEX IF NOT EXISTS idx_consent_records_granted ON consent_records(granted);

-- RLS for consent records
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent records
CREATE POLICY consent_records_select_policy ON consent_records
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own consent records
CREATE POLICY consent_records_insert_policy ON consent_records
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own consent records
CREATE POLICY consent_records_update_policy ON consent_records
  FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user has any pending deletion requests
CREATE OR REPLACE FUNCTION has_pending_deletion_request(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM deletion_requests
    WHERE user_id = p_user_id
      AND status IN ('pending', 'verified')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user data deletion status
CREATE OR REPLACE FUNCTION get_user_deletion_status(p_user_id UUID)
RETURNS TABLE (
  has_request BOOLEAN,
  status TEXT,
  scheduled_date TIMESTAMPTZ,
  days_until_deletion INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as has_request,
    dr.status,
    dr.scheduled_deletion_date,
    EXTRACT(DAY FROM (dr.scheduled_deletion_date - NOW()))::INTEGER as days_until_deletion
  FROM deletion_requests dr
  WHERE dr.user_id = p_user_id
    AND dr.status IN ('pending', 'verified')
  ORDER BY dr.created_at DESC
  LIMIT 1;

  -- If no result found, return default values
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TIMESTAMPTZ, NULL::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
--
-- This migration creates the core GDPR compliance tables:
-- 1. deletion_requests - Track user deletion requests (Article 17)
-- 2. gdpr_audit_log - Audit trail of data operations (Article 30)
-- 3. consent_records - Track user consent (Article 7)
--
-- Foreign key CASCADE constraints are intentionally NOT included
-- in this migration to avoid schema compatibility issues.
-- They should be added separately once the exact schema is verified.
--
-- The DataDeletionService will handle:
-- - Anonymizing ratings and messages before deletion
-- - Removing user profiles and cascade-deleting related data
-- - Respecting legal retention requirements
--
-- =====================================================
