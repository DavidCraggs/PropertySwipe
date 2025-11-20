-- Migration: Add seed_tag column to all tables for test data identification
-- Run this in your Supabase SQL Editor

-- Add seed_tag column to all tables that will contain seed data
ALTER TABLE renter_profiles ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE agency_property_links ADD COLUMN IF NOT EXISTS seed_tag text;

-- Create indexes for faster seed data queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_renter_profiles_seed_tag ON renter_profiles(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_seed_tag ON landlord_profiles(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agency_profiles_seed_tag ON agency_profiles(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_seed_tag ON properties(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_seed_tag ON matches(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_issues_seed_tag ON issues(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ratings_seed_tag ON ratings(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agency_property_links_seed_tag ON agency_property_links(seed_tag) WHERE seed_tag IS NOT NULL;

-- Verify the columns were added
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = 'seed_tag'
  AND table_schema = 'public'
ORDER BY table_name;
