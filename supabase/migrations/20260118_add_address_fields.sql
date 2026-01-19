-- Migration: Add address fields to renter and landlord profiles
-- Date: 2026-01-18
-- Description: Adds address columns for profile editing feature

-- Add address fields to renter_profiles
ALTER TABLE renter_profiles
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_county TEXT,
ADD COLUMN IF NOT EXISTS address_postcode TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'United Kingdom';

-- Add business address fields to landlord_profiles
ALTER TABLE landlord_profiles
ADD COLUMN IF NOT EXISTS business_address_line1 TEXT,
ADD COLUMN IF NOT EXISTS business_address_line2 TEXT,
ADD COLUMN IF NOT EXISTS business_address_city TEXT,
ADD COLUMN IF NOT EXISTS business_address_county TEXT,
ADD COLUMN IF NOT EXISTS business_address_postcode TEXT,
ADD COLUMN IF NOT EXISTS business_address_country TEXT DEFAULT 'United Kingdom';

-- Add county field to agency_profiles if not exists (align with Address interface)
ALTER TABLE agency_profiles
ADD COLUMN IF NOT EXISTS address_county TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'United Kingdom';

-- Create indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_renter_profiles_postcode ON renter_profiles(address_postcode);
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_postcode ON landlord_profiles(business_address_postcode);
