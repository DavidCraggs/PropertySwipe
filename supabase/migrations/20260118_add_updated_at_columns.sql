-- Migration: Add updated_at columns to profile tables
-- Date: 2026-01-18
-- Description: Adds updated_at columns that triggers expect

-- Add updated_at to landlord_profiles
ALTER TABLE landlord_profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at to renter_profiles
ALTER TABLE renter_profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at to agency_profiles
ALTER TABLE agency_profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS set_updated_at_landlord_profiles ON landlord_profiles;
DROP TRIGGER IF EXISTS set_updated_at_renter_profiles ON renter_profiles;
DROP TRIGGER IF EXISTS set_updated_at_agency_profiles ON agency_profiles;

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update the updated_at column
CREATE TRIGGER set_updated_at_landlord_profiles
    BEFORE UPDATE ON landlord_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_renter_profiles
    BEFORE UPDATE ON renter_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_agency_profiles
    BEFORE UPDATE ON agency_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
