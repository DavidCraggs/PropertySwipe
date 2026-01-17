-- Migration: Create Tenancy Agreements Tables
-- Description: Tables for document upload portal - tenancy agreements and signatures

-- =====================================================
-- TENANCY AGREEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenancy_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) NOT NULL,
  property_id UUID NOT NULL,
  landlord_id UUID NOT NULL,
  agency_id UUID,
  renter_id UUID NOT NULL,

  -- Document storage
  original_document_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_size_bytes INTEGER NOT NULL,

  -- Signed version (generated after all signatures)
  signed_document_path TEXT,
  signed_at TIMESTAMPTZ,

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  tenancy_start_date DATE,
  tenancy_end_date DATE,
  rent_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending_signatures',
  -- Values: draft, pending_signatures, partially_signed, fully_signed, expired, cancelled

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,

  -- Expiry (agreements expire if not signed within 14 days)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days')
);

-- =====================================================
-- AGREEMENT SIGNATORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agreement_signatories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES tenancy_agreements(id) ON DELETE CASCADE NOT NULL,

  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,

  signing_order INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,

  -- Signature data
  has_signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  signature_data TEXT,
  signature_type TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Notifications
  invitation_sent_at TIMESTAMPTZ,
  last_reminder_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AGREEMENT AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agreement_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES tenancy_agreements(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID,
  performed_by_type TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agreements_match ON tenancy_agreements(match_id);
CREATE INDEX IF NOT EXISTS idx_agreements_landlord ON tenancy_agreements(landlord_id);
CREATE INDEX IF NOT EXISTS idx_agreements_renter ON tenancy_agreements(renter_id);
CREATE INDEX IF NOT EXISTS idx_agreements_agency ON tenancy_agreements(agency_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON tenancy_agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_expires ON tenancy_agreements(expires_at);
CREATE INDEX IF NOT EXISTS idx_signatories_agreement ON agreement_signatories(agreement_id);
CREATE INDEX IF NOT EXISTS idx_signatories_user ON agreement_signatories(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_agreement ON agreement_audit_log(agreement_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON agreement_audit_log(created_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE tenancy_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_signatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_audit_log ENABLE ROW LEVEL SECURITY;

-- Tenancy agreements: visible to landlord, agency, and renter involved
CREATE POLICY "Users can view their own agreements" ON tenancy_agreements
  FOR SELECT USING (
    auth.uid() = landlord_id OR
    auth.uid() = agency_id OR
    auth.uid() = renter_id
  );

CREATE POLICY "Landlords and agencies can create agreements" ON tenancy_agreements
  FOR INSERT WITH CHECK (
    auth.uid() = landlord_id OR auth.uid() = agency_id
  );

CREATE POLICY "Landlords and agencies can update their agreements" ON tenancy_agreements
  FOR UPDATE USING (
    auth.uid() = landlord_id OR auth.uid() = agency_id
  );

-- Signatories: viewable by agreement parties, updatable by the signer
CREATE POLICY "Users can view signatories for their agreements" ON agreement_signatories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenancy_agreements
      WHERE id = agreement_id
      AND (landlord_id = auth.uid() OR agency_id = auth.uid() OR renter_id = auth.uid())
    )
  );

CREATE POLICY "Signers can update their own signature" ON agreement_signatories
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Agreement owners can insert signatories" ON agreement_signatories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenancy_agreements
      WHERE id = agreement_id
      AND (landlord_id = auth.uid() OR agency_id = auth.uid())
    )
  );

-- Audit log: viewable by agreement parties
CREATE POLICY "Users can view audit log for their agreements" ON agreement_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenancy_agreements
      WHERE id = agreement_id
      AND (landlord_id = auth.uid() OR agency_id = auth.uid() OR renter_id = auth.uid())
    )
  );

CREATE POLICY "Anyone can insert audit entries for their agreements" ON agreement_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenancy_agreements
      WHERE id = agreement_id
      AND (landlord_id = auth.uid() OR agency_id = auth.uid() OR renter_id = auth.uid())
    )
  );

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_tenancy_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenancy_agreements_updated_at
  BEFORE UPDATE ON tenancy_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_tenancy_agreements_updated_at();

-- =====================================================
-- FUNCTION TO CHECK IF ALL SIGNATORIES HAVE SIGNED
-- =====================================================
CREATE OR REPLACE FUNCTION check_agreement_fully_signed()
RETURNS TRIGGER AS $$
DECLARE
  all_signed BOOLEAN;
  agreement_record RECORD;
BEGIN
  -- Check if all required signatories have signed
  SELECT NOT EXISTS (
    SELECT 1 FROM agreement_signatories
    WHERE agreement_id = NEW.agreement_id
    AND is_required = TRUE
    AND has_signed = FALSE
  ) INTO all_signed;

  -- If all signed, update agreement status
  IF all_signed AND NEW.has_signed = TRUE THEN
    UPDATE tenancy_agreements
    SET status = 'fully_signed',
        signed_at = NOW()
    WHERE id = NEW.agreement_id;
  ELSIF NEW.has_signed = TRUE THEN
    -- At least one has signed, mark as partially signed
    UPDATE tenancy_agreements
    SET status = 'partially_signed'
    WHERE id = NEW.agreement_id
    AND status = 'pending_signatures';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_agreement_signed
  AFTER UPDATE OF has_signed ON agreement_signatories
  FOR EACH ROW
  WHEN (NEW.has_signed = TRUE AND OLD.has_signed = FALSE)
  EXECUTE FUNCTION check_agreement_fully_signed();
