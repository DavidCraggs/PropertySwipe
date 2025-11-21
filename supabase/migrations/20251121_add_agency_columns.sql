-- Migration: Add Agency Relationship Columns
-- Date: 2025-11-21
-- Description: Adds managing_agency_id and marketing_agent_id columns to properties and matches tables

-- Add agency columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS managing_agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS marketing_agent_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL;

-- Add agency columns to matches table  
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS managing_agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS marketing_agent_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_managing_agency ON properties(managing_agency_id);
CREATE INDEX IF NOT EXISTS idx_properties_marketing_agent ON properties(marketing_agent_id);
CREATE INDEX IF NOT EXISTS idx_matches_managing_agency ON matches(managing_agency_id);
CREATE INDEX IF NOT EXISTS idx_matches_marketing_agent ON matches(marketing_agent_id);

-- Add comments for documentation
COMMENT ON COLUMN properties.managing_agency_id IS 'Reference to the management agency handling this property';
COMMENT ON COLUMN properties.marketing_agent_id IS 'Reference to the estate agent marketing this property';
COMMENT ON COLUMN matches.managing_agency_id IS 'Reference to the management agency involved in this tenancy';
COMMENT ON COLUMN matches.marketing_agent_id IS 'Reference to the estate agent who facilitated this match';
