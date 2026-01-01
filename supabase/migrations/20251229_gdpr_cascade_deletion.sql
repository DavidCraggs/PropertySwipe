-- =====================================================
-- GDPR Cascade Deletion Rules Migration
-- =====================================================
--
-- This migration implements GDPR Article 17 "Right to Erasure" by setting up
-- cascade deletion rules for user data across all tables.
--
-- When a user requests deletion:
-- 1. Their profile record is deleted
-- 2. All related records are automatically deleted via CASCADE
-- 3. Records that should be anonymized (ratings, messages) are handled by the
--    DataDeletionService before profile deletion
--
-- Created: 2025-12-29
-- GDPR Compliance: Article 17 - Right to erasure ('right to be forgotten')
-- =====================================================

BEGIN;

-- =====================================================
-- DROP EXISTING FOREIGN KEY CONSTRAINTS
-- =====================================================
-- We need to drop existing constraints and recreate them with ON DELETE CASCADE

-- Properties table
ALTER TABLE IF EXISTS properties
  DROP CONSTRAINT IF EXISTS properties_landlord_id_fkey;

ALTER TABLE IF EXISTS properties
  DROP CONSTRAINT IF EXISTS properties_agency_id_fkey;

-- Matches table
ALTER TABLE IF EXISTS matches
  DROP CONSTRAINT IF EXISTS matches_renter_id_fkey;

ALTER TABLE IF EXISTS matches
  DROP CONSTRAINT IF EXISTS matches_landlord_id_fkey;

ALTER TABLE IF EXISTS matches
  DROP CONSTRAINT IF EXISTS matches_property_id_fkey;

ALTER TABLE IF EXISTS matches
  DROP CONSTRAINT IF EXISTS matches_agency_id_fkey;

-- Messages table
ALTER TABLE IF EXISTS messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE IF EXISTS messages
  DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

ALTER TABLE IF EXISTS messages
  DROP CONSTRAINT IF EXISTS messages_match_id_fkey;

-- Conversations table
ALTER TABLE IF EXISTS conversations
  DROP CONSTRAINT IF EXISTS conversations_match_id_fkey;

-- Ratings table
ALTER TABLE IF EXISTS ratings
  DROP CONSTRAINT IF EXISTS ratings_from_user_id_fkey;

ALTER TABLE IF EXISTS ratings
  DROP CONSTRAINT IF EXISTS ratings_to_user_id_fkey;

ALTER TABLE IF EXISTS ratings
  DROP CONSTRAINT IF EXISTS ratings_match_id_fkey;

ALTER TABLE IF EXISTS ratings
  DROP CONSTRAINT IF EXISTS ratings_property_id_fkey;

-- Viewing requests table
ALTER TABLE IF EXISTS viewing_requests
  DROP CONSTRAINT IF EXISTS viewing_requests_renter_id_fkey;

ALTER TABLE IF EXISTS viewing_requests
  DROP CONSTRAINT IF EXISTS viewing_requests_landlord_id_fkey;

ALTER TABLE IF EXISTS viewing_requests
  DROP CONSTRAINT IF EXISTS viewing_requests_property_id_fkey;

-- Agency landlord links table
ALTER TABLE IF EXISTS agency_landlord_links
  DROP CONSTRAINT IF EXISTS agency_landlord_links_agency_id_fkey;

ALTER TABLE IF EXISTS agency_landlord_links
  DROP CONSTRAINT IF EXISTS agency_landlord_links_landlord_id_fkey;

-- Agency link invitations table
ALTER TABLE IF EXISTS agency_link_invitations
  DROP CONSTRAINT IF EXISTS agency_link_invitations_agency_id_fkey;

ALTER TABLE IF EXISTS agency_link_invitations
  DROP CONSTRAINT IF EXISTS agency_link_invitations_landlord_id_fkey;

-- Renter invites table
ALTER TABLE IF EXISTS renter_invites
  DROP CONSTRAINT IF EXISTS renter_invites_inviter_id_fkey;

-- Maintenance issues table
ALTER TABLE IF EXISTS maintenance_issues
  DROP CONSTRAINT IF EXISTS maintenance_issues_property_id_fkey;

ALTER TABLE IF EXISTS maintenance_issues
  DROP CONSTRAINT IF EXISTS maintenance_issues_reported_by_fkey;

-- Hazard reports table (RRA 2025)
ALTER TABLE IF EXISTS hazard_reports
  DROP CONSTRAINT IF EXISTS hazard_reports_property_id_fkey;

ALTER TABLE IF EXISTS hazard_reports
  DROP CONSTRAINT IF EXISTS hazard_reports_reported_by_fkey;

-- Dispute cases table (RRA 2025)
ALTER TABLE IF EXISTS dispute_cases
  DROP CONSTRAINT IF EXISTS dispute_cases_renter_id_fkey;

ALTER TABLE IF EXISTS dispute_cases
  DROP CONSTRAINT IF EXISTS dispute_cases_landlord_id_fkey;

ALTER TABLE IF EXISTS dispute_cases
  DROP CONSTRAINT IF EXISTS dispute_cases_property_id_fkey;

-- =====================================================
-- RECREATE CONSTRAINTS WITH CASCADE DELETION
-- =====================================================

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================
-- When a landlord is deleted, their properties are deleted
ALTER TABLE properties
  ADD CONSTRAINT properties_landlord_id_fkey
  FOREIGN KEY (landlord_id)
  REFERENCES landlord_profiles(id)
  ON DELETE CASCADE;

-- When an agency is deleted, properties they manage are handled separately
-- (agency deletion should transfer properties to landlords first)
ALTER TABLE properties
  ADD CONSTRAINT properties_agency_id_fkey
  FOREIGN KEY (agency_id)
  REFERENCES agency_profiles(id)
  ON DELETE SET NULL; -- Don't cascade delete properties, just unlink them

-- =====================================================
-- MATCHES TABLE
-- =====================================================
-- When a renter is deleted, their matches are deleted
ALTER TABLE matches
  ADD CONSTRAINT matches_renter_id_fkey
  FOREIGN KEY (renter_id)
  REFERENCES renter_profiles(id)
  ON DELETE CASCADE;

-- When a landlord is deleted, their matches are deleted
ALTER TABLE matches
  ADD CONSTRAINT matches_landlord_id_fkey
  FOREIGN KEY (landlord_id)
  REFERENCES landlord_profiles(id)
  ON DELETE CASCADE;

-- When a property is deleted, matches for that property are deleted
ALTER TABLE matches
  ADD CONSTRAINT matches_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES properties(id)
  ON DELETE CASCADE;

-- When an agency is deleted, matches they facilitated are preserved
-- (the landlord-renter relationship continues)
ALTER TABLE matches
  ADD CONSTRAINT matches_agency_id_fkey
  FOREIGN KEY (agency_id)
  REFERENCES agency_profiles(id)
  ON DELETE SET NULL;

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
-- Messages are anonymized before deletion via DataDeletionService
-- These constraints ensure orphaned messages are cleaned up

-- Note: We use RESTRICT here because messages should be anonymized
-- via DataDeletionService BEFORE user deletion, not cascade deleted
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES renter_profiles(id)
  ON DELETE RESTRICT;

ALTER TABLE messages
  ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id)
  REFERENCES landlord_profiles(id)
  ON DELETE RESTRICT;

-- When a match is deleted, its messages are deleted
ALTER TABLE messages
  ADD CONSTRAINT messages_match_id_fkey
  FOREIGN KEY (match_id)
  REFERENCES matches(id)
  ON DELETE CASCADE;

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
-- When a match is deleted, its conversations are deleted
ALTER TABLE conversations
  ADD CONSTRAINT conversations_match_id_fkey
  FOREIGN KEY (match_id)
  REFERENCES matches(id)
  ON DELETE CASCADE;

-- =====================================================
-- RATINGS TABLE
-- =====================================================
-- Ratings are anonymized before deletion via DataDeletionService
-- These constraints ensure referential integrity

-- Note: We use RESTRICT here because ratings should be anonymized
-- via DataDeletionService BEFORE user deletion
ALTER TABLE ratings
  ADD CONSTRAINT ratings_from_user_id_fkey
  FOREIGN KEY (from_user_id)
  REFERENCES renter_profiles(id)
  ON DELETE RESTRICT;

ALTER TABLE ratings
  ADD CONSTRAINT ratings_to_user_id_fkey
  FOREIGN KEY (to_user_id)
  REFERENCES landlord_profiles(id)
  ON DELETE RESTRICT;

-- When a match is deleted, its ratings should be preserved (anonymized)
ALTER TABLE ratings
  ADD CONSTRAINT ratings_match_id_fkey
  FOREIGN KEY (match_id)
  REFERENCES matches(id)
  ON DELETE RESTRICT;

-- When a property is deleted, ratings about it are preserved (anonymized)
ALTER TABLE ratings
  ADD CONSTRAINT ratings_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES properties(id)
  ON DELETE RESTRICT;

-- =====================================================
-- VIEWING REQUESTS TABLE
-- =====================================================
-- When a renter is deleted, their viewing requests are deleted
ALTER TABLE viewing_requests
  ADD CONSTRAINT viewing_requests_renter_id_fkey
  FOREIGN KEY (renter_id)
  REFERENCES renter_profiles(id)
  ON DELETE CASCADE;

-- When a landlord is deleted, viewing requests for their properties are deleted
ALTER TABLE viewing_requests
  ADD CONSTRAINT viewing_requests_landlord_id_fkey
  FOREIGN KEY (landlord_id)
  REFERENCES landlord_profiles(id)
  ON DELETE CASCADE;

-- When a property is deleted, viewing requests for it are deleted
ALTER TABLE viewing_requests
  ADD CONSTRAINT viewing_requests_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES properties(id)
  ON DELETE CASCADE;

-- =====================================================
-- AGENCY LANDLORD LINKS TABLE
-- =====================================================
-- When an agency is deleted, their landlord links are deleted
ALTER TABLE agency_landlord_links
  ADD CONSTRAINT agency_landlord_links_agency_id_fkey
  FOREIGN KEY (agency_id)
  REFERENCES agency_profiles(id)
  ON DELETE CASCADE;

-- When a landlord is deleted, their agency links are deleted
ALTER TABLE agency_landlord_links
  ADD CONSTRAINT agency_landlord_links_landlord_id_fkey
  FOREIGN KEY (landlord_id)
  REFERENCES landlord_profiles(id)
  ON DELETE CASCADE;

-- =====================================================
-- AGENCY LINK INVITATIONS TABLE
-- =====================================================
-- When an agency is deleted, their pending invitations are deleted
ALTER TABLE agency_link_invitations
  ADD CONSTRAINT agency_link_invitations_agency_id_fkey
  FOREIGN KEY (agency_id)
  REFERENCES agency_profiles(id)
  ON DELETE CASCADE;

-- When a landlord is deleted, invitations sent to them are deleted
ALTER TABLE agency_link_invitations
  ADD CONSTRAINT agency_link_invitations_landlord_id_fkey
  FOREIGN KEY (landlord_id)
  REFERENCES landlord_profiles(id)
  ON DELETE CASCADE;

-- =====================================================
-- RENTER INVITES TABLE
-- =====================================================
-- When the inviter (landlord/agency) is deleted, invites are deleted
ALTER TABLE renter_invites
  ADD CONSTRAINT renter_invites_inviter_id_fkey
  FOREIGN KEY (inviter_id)
  REFERENCES landlord_profiles(id)
  ON DELETE CASCADE;

-- =====================================================
-- MAINTENANCE ISSUES TABLE
-- =====================================================
-- When a property is deleted, its maintenance issues are deleted
ALTER TABLE maintenance_issues
  ADD CONSTRAINT maintenance_issues_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES properties(id)
  ON DELETE CASCADE;

-- When the reporter (renter) is deleted, their reports are preserved
-- (landlord needs historical maintenance records)
ALTER TABLE maintenance_issues
  ADD CONSTRAINT maintenance_issues_reported_by_fkey
  FOREIGN KEY (reported_by)
  REFERENCES renter_profiles(id)
  ON DELETE SET NULL;

-- =====================================================
-- HAZARD REPORTS TABLE (RRA 2025 Compliance)
-- =====================================================
-- When a property is deleted, its hazard reports must be preserved
-- (legal requirement for landlord compliance records)
ALTER TABLE hazard_reports
  ADD CONSTRAINT hazard_reports_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES properties(id)
  ON DELETE RESTRICT; -- Cannot delete property with active hazard reports

-- When the reporter (renter) is deleted, reports are preserved
ALTER TABLE hazard_reports
  ADD CONSTRAINT hazard_reports_reported_by_fkey
  FOREIGN KEY (reported_by)
  REFERENCES renter_profiles(id)
  ON DELETE SET NULL;

-- =====================================================
-- DISPUTE CASES TABLE (RRA 2025 Compliance)
-- =====================================================
-- Disputes must be preserved for legal compliance
-- User deletion anonymizes their role but preserves case records

ALTER TABLE dispute_cases
  ADD CONSTRAINT dispute_cases_renter_id_fkey
  FOREIGN KEY (renter_id)
  REFERENCES renter_profiles(id)
  ON DELETE RESTRICT; -- Must anonymize first, not cascade

ALTER TABLE dispute_cases
  ADD CONSTRAINT dispute_cases_landlord_id_fkey
  FOREIGN KEY (landlord_id)
  REFERENCES landlord_profiles(id)
  ON DELETE RESTRICT; -- Must anonymize first, not cascade

ALTER TABLE dispute_cases
  ADD CONSTRAINT dispute_cases_property_id_fkey
  FOREIGN KEY (property_id)
  REFERENCES properties(id)
  ON DELETE RESTRICT; -- Must preserve for legal records

-- =====================================================
-- CREATE DELETION REQUEST TRACKING TABLE
-- =====================================================
-- This table tracks GDPR deletion requests per Article 17

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

-- Index for efficient lookups
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
-- Cascade Deletion Strategy:
--
-- 1. CASCADE DELETE (automatic deletion):
--    - Properties -> Landlord deletion
--    - Matches -> Renter/Landlord/Property deletion
--    - Messages -> Match deletion
--    - Conversations -> Match deletion
--    - Viewing Requests -> Renter/Landlord/Property deletion
--    - Agency Links -> Agency/Landlord deletion
--    - Maintenance Issues -> Property deletion
--
-- 2. SET NULL (preserve record, remove reference):
--    - Properties -> Agency deletion (transfer to landlord)
--    - Matches -> Agency deletion (preserve match)
--    - Maintenance Issues -> Renter deletion (preserve history)
--    - Hazard Reports -> Renter deletion (legal requirement)
--
-- 3. RESTRICT (must handle manually):
--    - Messages -> User deletion (anonymize first via DataDeletionService)
--    - Ratings -> User deletion (anonymize first via DataDeletionService)
--    - Disputes -> User deletion (anonymize first - legal requirement)
--    - Hazard Reports -> Property deletion (legal requirement)
--
-- This approach ensures:
-- - GDPR Article 17 compliance (right to erasure)
-- - RRA 2025 compliance (preserve legal records)
-- - Data integrity (no orphaned records)
-- - Analytics preservation (anonymized aggregate data)
--
-- =====================================================
