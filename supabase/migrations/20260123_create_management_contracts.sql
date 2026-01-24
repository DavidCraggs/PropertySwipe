-- Migration: Create management_contracts table
-- Date: 2026-01-23
-- Description: Adds management contracts for landlord-agency relationships

-- Create management_contracts table
CREATE TABLE IF NOT EXISTS management_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_ids UUID[] NOT NULL,

  -- Service level
  service_level TEXT NOT NULL CHECK (service_level IN ('let_only', 'rent_collection', 'full_management')),

  -- Commission & fees
  commission_rate DECIMAL(5,2) NOT NULL,
  let_only_fee DECIMAL(10,2),
  contract_length_months INTEGER NOT NULL,
  notice_period_days INTEGER NOT NULL DEFAULT 30,
  renewal_type TEXT NOT NULL DEFAULT 'manual' CHECK (renewal_type IN ('auto', 'manual', 'none')),

  -- Service inclusions (JSONB for flexibility)
  included_services JSONB NOT NULL DEFAULT '{
    "tenantFinding": true,
    "referenceChecking": true,
    "rentCollection": false,
    "propertyInspections": false,
    "maintenanceCoordination": false,
    "tenantCommunication": false,
    "legalCompliance": false,
    "evictionHandling": false
  }',

  -- Payment terms
  payment_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly')),
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'standing_order')),
  invoice_due_within_days INTEGER NOT NULL DEFAULT 14,

  -- SLA terms
  emergency_response_hours INTEGER NOT NULL DEFAULT 24,
  routine_response_days INTEGER NOT NULL DEFAULT 5,
  rent_remittance_days INTEGER NOT NULL DEFAULT 7,
  inspection_frequency TEXT NOT NULL DEFAULT 'quarterly' CHECK (inspection_frequency IN ('monthly', 'quarterly', 'biannually')),

  -- Status & dates
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_landlord', 'pending_agency', 'active', 'terminated', 'expired')),
  signed_by_landlord_at TIMESTAMPTZ,
  signed_by_agency_at TIMESTAMPTZ,
  effective_from DATE,
  effective_until DATE,
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,

  -- PDF generation
  generated_pdf_path TEXT,
  generated_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_management_contracts_landlord ON management_contracts(landlord_id);
CREATE INDEX IF NOT EXISTS idx_management_contracts_agency ON management_contracts(agency_id);
CREATE INDEX IF NOT EXISTS idx_management_contracts_status ON management_contracts(status);
CREATE INDEX IF NOT EXISTS idx_management_contracts_effective_dates ON management_contracts(effective_from, effective_until);

-- Enable RLS
ALTER TABLE management_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Landlords can view their own contracts
CREATE POLICY "Landlords can view own contracts"
  ON management_contracts FOR SELECT
  USING (landlord_id = auth.uid());

-- Agencies can view contracts involving them
CREATE POLICY "Agencies can view contracts involving them"
  ON management_contracts FOR SELECT
  USING (agency_id = auth.uid());

-- Landlords can create contracts
CREATE POLICY "Landlords can create contracts"
  ON management_contracts FOR INSERT
  WITH CHECK (landlord_id = auth.uid() AND created_by = auth.uid());

-- Agencies can also create contracts (invite flow)
CREATE POLICY "Agencies can create contracts"
  ON management_contracts FOR INSERT
  WITH CHECK (agency_id = auth.uid() AND created_by = auth.uid());

-- Landlords can update their own contracts (for signing, etc.)
CREATE POLICY "Landlords can update own contracts"
  ON management_contracts FOR UPDATE
  USING (landlord_id = auth.uid());

-- Agencies can update contracts involving them (for signing, etc.)
CREATE POLICY "Agencies can update contracts involving them"
  ON management_contracts FOR UPDATE
  USING (agency_id = auth.uid());

-- Only landlords can delete draft contracts they created
CREATE POLICY "Landlords can delete own draft contracts"
  ON management_contracts FOR DELETE
  USING (landlord_id = auth.uid() AND status = 'draft');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_management_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_management_contracts_updated_at
  BEFORE UPDATE ON management_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_management_contracts_updated_at();

-- Comments for documentation
COMMENT ON TABLE management_contracts IS 'Stores management contracts between landlords and agencies';
COMMENT ON COLUMN management_contracts.service_level IS 'Type of management service: let_only, rent_collection, or full_management';
COMMENT ON COLUMN management_contracts.commission_rate IS 'Commission rate as percentage (e.g., 10.00 = 10%)';
COMMENT ON COLUMN management_contracts.let_only_fee IS 'One-time fee for let-only service in GBP';
COMMENT ON COLUMN management_contracts.included_services IS 'JSON object defining which services are included';
COMMENT ON COLUMN management_contracts.property_ids IS 'Array of property IDs covered by this contract';
