-- =====================================================
-- PropertySwipe - Multi-Role Platform Database Schema
-- Supabase SQL Schema for Phases 1-8
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES (Clean deployment)
-- =====================================================
-- Drop tables in reverse dependency order (CASCADE will handle triggers)
DROP TABLE IF EXISTS email_notifications CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS agency_property_links CASCADE;
DROP TABLE IF EXISTS agency_link_invitations CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS agency_profiles CASCADE;
DROP TABLE IF EXISTS landlord_profiles CASCADE;
DROP TABLE IF EXISTS renter_profiles CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS expire_old_invitations() CASCADE;

-- =====================================================
-- RENTER PROFILES TABLE (Extended for Multi-Role)
-- =====================================================
CREATE TABLE renter_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Renter Lifecycle (Phase 1)
    status TEXT NOT NULL DEFAULT 'prospective' CHECK (status IN ('prospective', 'current', 'former')),
    current_tenancy_id UUID,
    current_property_id UUID,
    current_landlord_id UUID,
    current_agency_id UUID,
    move_in_date TIMESTAMPTZ,

    -- Basic Info
    situation TEXT NOT NULL,
    names TEXT NOT NULL,
    ages TEXT NOT NULL,
    local_area TEXT NOT NULL,
    renter_type TEXT NOT NULL,
    employment_status TEXT NOT NULL,

    -- Financial
    monthly_income DECIMAL(10,2) NOT NULL,

    -- Preferences
    has_pets BOOLEAN DEFAULT FALSE,
    pet_details TEXT,
    smoking_status TEXT,
    has_guarantor BOOLEAN DEFAULT FALSE,
    preferred_move_in_date DATE,

    -- RRA 2025 Compliance
    current_rental_situation TEXT,
    has_rental_history BOOLEAN DEFAULT FALSE,
    previous_landlord_reference BOOLEAN DEFAULT FALSE,
    receives_housing_benefit BOOLEAN DEFAULT FALSE,
    receives_universal_credit BOOLEAN DEFAULT FALSE,
    number_of_children INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_complete BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- LANDLORD PROFILES TABLE (Extended for Multi-Role)
-- =====================================================
CREATE TABLE landlord_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Agency Relationships (Phase 1)
    management_agency_id UUID,
    estate_agent_id UUID,
    agent_commission_rate DECIMAL(5,2),

    -- Contact Preferences (Phase 1)
    preferred_contact_method TEXT DEFAULT 'both' CHECK (preferred_contact_method IN ('in_app', 'email', 'both')),
    notification_email TEXT,

    -- Basic Info
    names TEXT NOT NULL,
    property_type TEXT NOT NULL,
    preferred_tenant_types TEXT[],
    furnishing_preference TEXT NOT NULL,
    default_pets_policy JSONB NOT NULL,
    estate_agent_link TEXT,
    property_id UUID,

    -- RRA 2025 Compliance
    prs_registration_number TEXT,
    prs_registration_status TEXT,
    prs_registration_date DATE,
    prs_registration_expiry_date DATE,
    ombudsman_scheme TEXT,
    ombudsman_membership_number TEXT,
    deposit_scheme TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_complete BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- AGENCY PROFILES TABLE (Phase 1 - NEW)
-- =====================================================
CREATE TABLE agency_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    agency_type TEXT NOT NULL CHECK (agency_type IN ('estate_agent', 'management_agency')),
    company_name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    trading_name TEXT,

    -- Contact
    primary_contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_street TEXT NOT NULL,
    address_city TEXT NOT NULL,
    address_postcode TEXT NOT NULL,

    -- Service Areas
    service_areas TEXT[] NOT NULL,

    -- Portfolio
    managed_property_ids UUID[] DEFAULT '{}',
    landlord_client_ids UUID[] DEFAULT '{}',
    active_tenants_count INTEGER DEFAULT 0,
    total_properties_managed INTEGER DEFAULT 0,

    -- SLA Configuration (Phase 5)
    sla_emergency_response_hours INTEGER NOT NULL DEFAULT 4,
    sla_urgent_response_hours INTEGER NOT NULL DEFAULT 24,
    sla_routine_response_hours INTEGER NOT NULL DEFAULT 72,
    sla_maintenance_response_days INTEGER NOT NULL DEFAULT 14,

    -- Performance Metrics (Phase 6)
    avg_response_time_hours DECIMAL(5,1) DEFAULT 0,
    sla_compliance_rate DECIMAL(5,2) DEFAULT 100.0,
    total_issues_resolved INTEGER DEFAULT 0,
    total_issues_raised INTEGER DEFAULT 0,
    current_open_issues INTEGER DEFAULT 0,

    -- Compliance
    property_ombudsman_member BOOLEAN DEFAULT FALSE,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry_date DATE,

    -- Branding
    logo TEXT,
    brand_color TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    is_complete BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID REFERENCES landlord_profiles(id) ON DELETE SET NULL,
    managing_agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL,

    -- Address
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    postcode TEXT NOT NULL,
    council TEXT,

    -- Basic Details
    rent_pcm INTEGER NOT NULL CHECK (rent_pcm > 0),
    deposit INTEGER NOT NULL CHECK (deposit >= 0),
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0),
    property_type TEXT NOT NULL,
    year_built INTEGER CHECK (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM CURRENT_DATE)),

    -- Listing Details
    description TEXT NOT NULL,
    epc_rating TEXT NOT NULL CHECK (epc_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    images TEXT[] NOT NULL,
    features TEXT[] NOT NULL,
    furnishing TEXT NOT NULL,
    available_from DATE,
    tenancy_type TEXT,
    max_occupants INTEGER,
    pets_policy JSONB,

    -- Bills
    council_tax_band TEXT,
    gas_electric_included BOOLEAN DEFAULT FALSE,
    water_included BOOLEAN DEFAULT FALSE,
    internet_included BOOLEAN DEFAULT FALSE,

    -- RRA 2025 Compliance
    meets_decent_homes_standard BOOLEAN DEFAULT FALSE,
    awaabs_law_compliant BOOLEAN DEFAULT FALSE,
    last_safety_inspection_date DATE,
    prs_property_registration_number TEXT,
    prs_property_registration_status TEXT,

    -- Listing Status
    can_be_marketed BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    listing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    preferred_minimum_stay INTEGER,
    accepts_short_term_tenants BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MATCHES TABLE (Extended for Tenancy Lifecycle)
-- =====================================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    landlord_id UUID REFERENCES landlord_profiles(id) ON DELETE CASCADE,
    renter_id UUID REFERENCES renter_profiles(id) ON DELETE CASCADE,

    -- Tenancy Lifecycle (Phase 1)
    tenancy_status TEXT NOT NULL DEFAULT 'prospective' CHECK (tenancy_status IN ('prospective', 'active', 'notice_given', 'ended')),
    managing_agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL,
    marketing_agent_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL,

    -- Active Tenancy Data (Phase 1)
    monthly_rent_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    deposit_scheme_reference TEXT,

    -- Issue Tracking (Phase 1)
    active_issue_ids UUID[] DEFAULT '{}',
    total_issues_raised INTEGER DEFAULT 0,
    total_issues_resolved INTEGER DEFAULT 0,

    -- Renter Information
    renter_name TEXT NOT NULL,
    renter_profile JSONB,

    -- Messages
    messages JSONB[] DEFAULT '{}',
    last_message_at TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0,

    -- Viewing Details
    has_viewing_scheduled BOOLEAN DEFAULT FALSE,
    confirmed_viewing_date TIMESTAMPTZ,
    viewing_preference JSONB,

    -- Application Status
    application_status TEXT DEFAULT 'pending',
    application_submitted_at TIMESTAMPTZ,
    tenancy_start_date TIMESTAMPTZ,
    tenancy_noticed_date TIMESTAMPTZ,

    -- RRA 2025 Compliance
    is_under_eviction_proceedings BOOLEAN DEFAULT FALSE,
    rent_arrears JSONB DEFAULT '{"totalOwed": 0, "monthsMissed": 0, "consecutiveMonthsMissed": 0}'::jsonb,

    -- Ratings
    can_rate BOOLEAN DEFAULT FALSE,
    has_landlord_rated BOOLEAN DEFAULT FALSE,
    has_renter_rated BOOLEAN DEFAULT FALSE,
    landlord_rating_id UUID,
    renter_rating_id UUID,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ISSUES TABLE (Phase 1 - NEW)
-- =====================================================
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES renter_profiles(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL,
    assigned_to_agent_id TEXT,

    -- Issue Details
    category TEXT NOT NULL CHECK (category IN ('maintenance', 'repair', 'complaint', 'query', 'hazard', 'dispute')),
    priority TEXT NOT NULL CHECK (priority IN ('emergency', 'urgent', 'routine', 'low')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',

    -- Timeline
    raised_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,

    -- SLA Tracking (Phase 7)
    sla_deadline TIMESTAMPTZ NOT NULL,
    is_overdue BOOLEAN DEFAULT FALSE,
    response_time_hours DECIMAL(8,1),
    resolution_time_days DECIMAL(8,1),

    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'awaiting_parts', 'awaiting_access', 'resolved', 'closed')),
    status_history JSONB[] DEFAULT '{}',

    -- Communication
    messages JSONB[] DEFAULT '{}',
    internal_notes TEXT[] DEFAULT '{}',

    -- Resolution
    resolution_summary TEXT,
    resolution_cost DECIMAL(10,2),
    renter_satisfaction_rating INTEGER CHECK (renter_satisfaction_rating >= 1 AND renter_satisfaction_rating <= 5),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EMAIL NOTIFICATIONS TABLE (Phase 8 - NEW)
-- =====================================================
CREATE TABLE email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Recipient
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,

    -- Email Content
    type TEXT NOT NULL CHECK (type IN ('new_message_renter', 'new_message_landlord', 'new_message_agency', 'new_issue_raised', 'issue_acknowledged', 'issue_status_update', 'issue_resolved', 'sla_approaching', 'sla_breached')),
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,

    -- Context
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,

    -- Delivery Tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    failure_reason TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RATINGS TABLE (Existing - for reference)
-- =====================================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    rated_user_id UUID NOT NULL,
    rated_user_type TEXT NOT NULL CHECK (rated_user_type IN ('landlord', 'renter')),
    rater_user_id UUID NOT NULL,
    rater_user_type TEXT NOT NULL CHECK (rater_user_type IN ('landlord', 'renter')),

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AGENCY LINK INVITATIONS TABLE (NEW - Property Linking System)
-- =====================================================
CREATE TABLE agency_link_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Parties involved
    landlord_id UUID NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- NULL = all properties

    -- Invitation details
    invitation_type TEXT NOT NULL CHECK (invitation_type IN ('estate_agent', 'management_agency')),
    initiated_by TEXT NOT NULL CHECK (initiated_by IN ('landlord', 'agency')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),

    -- Terms
    proposed_commission_rate DECIMAL(5,2), -- e.g., 10.00 = 10%
    proposed_contract_length_months INTEGER, -- e.g., 12 months
    message TEXT, -- Optional message from sender

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    responded_at TIMESTAMPTZ,

    -- Response
    response_message TEXT,

    -- Prevent duplicate invitations for same landlord-agency-property-type combination
    UNIQUE(landlord_id, agency_id, property_id, invitation_type)
);

-- =====================================================
-- AGENCY PROPERTY LINKS TABLE (NEW - Property Linking System)
-- =====================================================
CREATE TABLE agency_property_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    landlord_id UUID NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Link type
    link_type TEXT NOT NULL CHECK (link_type IN ('estate_agent', 'management_agency')),

    -- Contract terms
    commission_rate DECIMAL(5,2) NOT NULL, -- e.g., 10.00 = 10%
    contract_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    contract_end_date DATE, -- NULL = ongoing/periodic

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    termination_reason TEXT,
    terminated_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Performance tracking
    total_rent_collected DECIMAL(12,2) DEFAULT 0,
    total_commission_earned DECIMAL(12,2) DEFAULT 0,

    -- Enforce one estate agent + one management agency per property
    UNIQUE(property_id, link_type)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Renter Profiles
CREATE INDEX idx_renter_status ON renter_profiles(status);
CREATE INDEX idx_renter_current_tenancy ON renter_profiles(current_tenancy_id) WHERE current_tenancy_id IS NOT NULL;
CREATE INDEX idx_renter_agency ON renter_profiles(current_agency_id) WHERE current_agency_id IS NOT NULL;

-- Landlord Profiles
CREATE INDEX idx_landlord_agency ON landlord_profiles(management_agency_id) WHERE management_agency_id IS NOT NULL;
CREATE INDEX idx_landlord_property ON landlord_profiles(property_id) WHERE property_id IS NOT NULL;

-- Agency Profiles
CREATE INDEX idx_agency_type ON agency_profiles(agency_type);
CREATE INDEX idx_agency_active ON agency_profiles(is_active) WHERE is_active = TRUE;

-- Properties
CREATE INDEX idx_property_landlord ON properties(landlord_id);
CREATE INDEX idx_property_agency ON properties(managing_agency_id) WHERE managing_agency_id IS NOT NULL;
CREATE INDEX idx_property_available ON properties(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_property_postcode ON properties(postcode);

-- Matches
CREATE INDEX idx_match_property ON matches(property_id);
CREATE INDEX idx_match_landlord ON matches(landlord_id);
CREATE INDEX idx_match_renter ON matches(renter_id);
CREATE INDEX idx_match_status ON matches(tenancy_status);
CREATE INDEX idx_match_agency ON matches(managing_agency_id) WHERE managing_agency_id IS NOT NULL;

-- Issues
CREATE INDEX idx_issue_property ON issues(property_id);
CREATE INDEX idx_issue_renter ON issues(renter_id);
CREATE INDEX idx_issue_landlord ON issues(landlord_id);
CREATE INDEX idx_issue_agency ON issues(agency_id) WHERE agency_id IS NOT NULL;
CREATE INDEX idx_issue_status ON issues(status);
CREATE INDEX idx_issue_priority ON issues(priority);
CREATE INDEX idx_issue_overdue ON issues(is_overdue) WHERE is_overdue = TRUE;
CREATE INDEX idx_issue_sla_deadline ON issues(sla_deadline);

-- Email Notifications
CREATE INDEX idx_email_status ON email_notifications(status);
CREATE INDEX idx_email_type ON email_notifications(type);
CREATE INDEX idx_email_issue ON email_notifications(issue_id) WHERE issue_id IS NOT NULL;

-- Ratings
CREATE INDEX idx_rating_match ON ratings(match_id);
CREATE INDEX idx_rating_rated_user ON ratings(rated_user_id, rated_user_type);

-- Agency Link Invitations
CREATE INDEX idx_invitation_landlord ON agency_link_invitations(landlord_id);
CREATE INDEX idx_invitation_agency ON agency_link_invitations(agency_id);
CREATE INDEX idx_invitation_property ON agency_link_invitations(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_invitation_status ON agency_link_invitations(status);
CREATE INDEX idx_invitation_expires ON agency_link_invitations(expires_at) WHERE status = 'pending';
CREATE INDEX idx_invitation_type ON agency_link_invitations(invitation_type);

-- Agency Property Links
CREATE INDEX idx_link_landlord ON agency_property_links(landlord_id);
CREATE INDEX idx_link_agency ON agency_property_links(agency_id);
CREATE INDEX idx_link_property ON agency_property_links(property_id);
CREATE INDEX idx_link_type ON agency_property_links(link_type);
CREATE INDEX idx_link_active ON agency_property_links(is_active) WHERE is_active = TRUE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE renter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_link_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_property_links ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (replace with proper auth policies in production)
CREATE POLICY "Allow all for now" ON renter_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON landlord_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON agency_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON matches FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON issues FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON email_notifications FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON ratings FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON agency_link_invitations FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON agency_property_links FOR ALL USING (true);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_links_updated_at BEFORE UPDATE ON agency_property_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INVITATION EXPIRATION FUNCTION
-- =====================================================

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE agency_link_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: In production, use pg_cron or external scheduler to run this daily:
-- SELECT cron.schedule('expire-invitations', '0 0 * * *', 'SELECT expire_old_invitations()');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ PropertySwipe Multi-Role Schema Created Successfully!';
    RAISE NOTICE '📊 Tables created: 10 (renter_profiles, landlord_profiles, agency_profiles, properties, matches, issues, email_notifications, ratings, agency_link_invitations, agency_property_links)';
    RAISE NOTICE '🔗 Agency linking system enabled with bidirectional invitations';
    RAISE NOTICE '🔒 RLS enabled with permissive policies for development';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🚀 Ready for deployment!';
END $$;
