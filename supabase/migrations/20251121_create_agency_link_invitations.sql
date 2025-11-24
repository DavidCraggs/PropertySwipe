-- Migration: Create Agency Link Invitations Table
-- Date: 2025-11-21
-- Description: Creates the agency_link_invitations table for tracking invitation workflow between agencies and landlords

-- Drop the table if it exists (in case it was created without seed_tag column)
DROP TABLE IF EXISTS agency_link_invitations CASCADE;

-- Create the agency_link_invitations table
CREATE TABLE agency_link_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
    invitation_type TEXT NOT NULL CHECK (invitation_type IN ('estate_agent', 'management_agency')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    commission_rate DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    seed_tag TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_agency_link_invitations_agency_id ON agency_link_invitations(agency_id);
CREATE INDEX idx_agency_link_invitations_landlord_id ON agency_link_invitations(landlord_id);
CREATE INDEX idx_agency_link_invitations_status ON agency_link_invitations(status);
CREATE INDEX idx_agency_link_invitations_seed_tag ON agency_link_invitations(seed_tag) WHERE seed_tag IS NOT NULL;

-- Add table and column comments for documentation
COMMENT ON TABLE agency_link_invitations IS 'Tracks invitation workflow between agencies and landlords for property management and marketing services';
COMMENT ON COLUMN agency_link_invitations.id IS 'Unique identifier for the invitation';
COMMENT ON COLUMN agency_link_invitations.agency_id IS 'Reference to the agency sending the invitation';
COMMENT ON COLUMN agency_link_invitations.landlord_id IS 'Reference to the landlord receiving the invitation';
COMMENT ON COLUMN agency_link_invitations.invitation_type IS 'Type of service: estate_agent (marketing) or management_agency (full management)';
COMMENT ON COLUMN agency_link_invitations.status IS 'Current status: pending, accepted, or declined';
COMMENT ON COLUMN agency_link_invitations.message IS 'Invitation message from the agency to the landlord';
COMMENT ON COLUMN agency_link_invitations.commission_rate IS 'Proposed commission rate as a percentage (e.g., 10.00 for 10%)';
COMMENT ON COLUMN agency_link_invitations.created_at IS 'Timestamp when the invitation was created';
COMMENT ON COLUMN agency_link_invitations.responded_at IS 'Timestamp when the landlord responded (accepted or declined)';
COMMENT ON COLUMN agency_link_invitations.seed_tag IS 'Tag for identifying test/seed data for easy cleanup';
