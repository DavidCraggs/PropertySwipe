-- Migration: Add seed_tag Columns for Test Data Identification
-- Date: 2025-11-21
-- Description: Adds seed_tag columns to all tables for identifying and cleaning up test data

-- Add seed_tag columns to profile tables
ALTER TABLE renter_profiles
ADD COLUMN IF NOT EXISTS seed_tag TEXT;

ALTER TABLE landlord_profiles
ADD COLUMN IF NOT EXISTS seed_tag TEXT;

ALTER TABLE agency_profiles
ADD COLUMN IF NOT EXISTS seed_tag TEXT;

-- Add seed_tag columns to transactional tables
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS seed_tag TEXT;

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS seed_tag TEXT;

ALTER TABLE issues
ADD COLUMN IF NOT EXISTS seed_tag TEXT;

ALTER TABLE ratings
ADD COLUMN IF NOT EXISTS seed_tag TEXT;

ALTER TABLE agency_property_links
ADD COLUMN IF NOT EXISTS seed_tag TEXT;

-- Create indexes for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_renter_profiles_seed_tag ON renter_profiles(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_seed_tag ON landlord_profiles(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agency_profiles_seed_tag ON agency_profiles(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_seed_tag ON properties(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_seed_tag ON matches(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_issues_seed_tag ON issues(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ratings_seed_tag ON ratings(seed_tag) WHERE seed_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agency_property_links_seed_tag ON agency_property_links(seed_tag) WHERE seed_tag IS NOT NULL;

-- Add documentation comments
COMMENT ON COLUMN renter_profiles.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
COMMENT ON COLUMN landlord_profiles.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
COMMENT ON COLUMN agency_profiles.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
COMMENT ON COLUMN properties.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
COMMENT ON COLUMN matches.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
COMMENT ON COLUMN issues.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
COMMENT ON COLUMN ratings.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
COMMENT ON COLUMN agency_property_links.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
