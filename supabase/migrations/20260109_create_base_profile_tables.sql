-- =====================================================
-- BASE PROFILE TABLES MIGRATION
-- Creates landlord_profiles, renter_profiles, and agency_profiles tables
-- Required for PropertySwipe core functionality
-- =====================================================

-- =====================================================
-- LANDLORD PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS landlord_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    names TEXT NOT NULL,
    property_type TEXT,

    -- Preferences
    furnishing_preference TEXT DEFAULT 'Unfurnished',
    preferred_tenant_types JSONB DEFAULT '[]'::jsonb,

    -- Pets policy (RRA 2025 compliant - must consider pets)
    default_pets_policy JSONB DEFAULT '{
        "willConsiderPets": true,
        "requiresPetInsurance": true,
        "preferredPetTypes": [],
        "maxPetsAllowed": 2
    }'::jsonb,

    -- RRA 2025: PRS Database Registration (MANDATORY)
    prs_registration_number TEXT,
    prs_registration_status TEXT DEFAULT 'not_registered',
    prs_registration_date TIMESTAMPTZ,
    prs_registration_expiry_date TIMESTAMPTZ,

    -- RRA 2025: Ombudsman Membership (MANDATORY)
    ombudsman_scheme TEXT DEFAULT 'not_registered',
    ombudsman_membership_number TEXT,

    -- Compliance
    is_fully_compliant BOOLEAN DEFAULT false,

    -- Deposit scheme
    deposit_scheme TEXT,

    -- Legacy fields
    estate_agent_link TEXT,
    property_id UUID, -- Legacy single property link

    -- Agency relationships
    management_agency_id UUID,
    estate_agent_id UUID,
    agent_commission_rate NUMERIC(5,2),

    -- Contact preferences
    preferred_contact_method TEXT DEFAULT 'in_app',
    notification_email TEXT,

    -- Rating summary
    average_rating NUMERIC(3,2),
    total_ratings INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    onboarding_complete BOOLEAN DEFAULT false,

    -- Seed tag for test data cleanup
    seed_tag TEXT
);

-- Indexes for landlord_profiles
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_email ON landlord_profiles(email);
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_prs_status ON landlord_profiles(prs_registration_status);
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_seed_tag ON landlord_profiles(seed_tag) WHERE seed_tag IS NOT NULL;

-- =====================================================
-- RENTER PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS renter_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    names TEXT NOT NULL,

    -- Renter status (prospective, current, former)
    renter_status TEXT DEFAULT 'prospective',

    -- Search preferences
    situation TEXT,
    occupants INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    employment_status TEXT,
    combined_income NUMERIC(10,2),

    -- Location preferences
    preferred_locations JSONB DEFAULT '[]'::jsonb,
    max_commute_time INTEGER,

    -- Property preferences
    min_bedrooms INTEGER DEFAULT 1,
    max_bedrooms INTEGER,
    preferred_property_types JSONB DEFAULT '[]'::jsonb,
    min_rent NUMERIC(10,2),
    max_rent NUMERIC(10,2),
    furnishing_preference TEXT,

    -- Pets
    has_pets BOOLEAN DEFAULT false,
    pet_details JSONB,

    -- Current tenancy (for current renters)
    current_property_id UUID,
    current_landlord_id UUID,
    current_agency_id UUID,
    tenancy_start_date DATE,
    current_rent NUMERIC(10,2),

    -- Rating summary
    average_rating NUMERIC(3,2),
    total_ratings INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    onboarding_complete BOOLEAN DEFAULT false,

    -- Seed tag for test data cleanup
    seed_tag TEXT
);

-- Indexes for renter_profiles
CREATE INDEX IF NOT EXISTS idx_renter_profiles_email ON renter_profiles(email);
CREATE INDEX IF NOT EXISTS idx_renter_profiles_status ON renter_profiles(renter_status);
CREATE INDEX IF NOT EXISTS idx_renter_profiles_current_property ON renter_profiles(current_property_id) WHERE current_property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_renter_profiles_current_landlord ON renter_profiles(current_landlord_id) WHERE current_landlord_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_renter_profiles_seed_tag ON renter_profiles(seed_tag) WHERE seed_tag IS NOT NULL;

-- =====================================================
-- AGENCY PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS agency_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    -- Agency details
    agency_name TEXT NOT NULL,
    agency_type TEXT NOT NULL, -- 'estate_agent' or 'management_agency'

    -- Registration
    company_number TEXT,
    vat_number TEXT,

    -- Address
    office_address JSONB,

    -- Contact
    phone TEXT,
    website TEXT,

    -- Compliance
    prs_registration_number TEXT,
    prs_registration_status TEXT DEFAULT 'not_registered',
    redress_scheme TEXT,
    redress_membership_number TEXT,
    client_money_protection_scheme TEXT,

    -- Rating summary
    average_rating NUMERIC(3,2),
    total_ratings INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    onboarding_complete BOOLEAN DEFAULT false,

    -- Seed tag for test data cleanup
    seed_tag TEXT
);

-- Indexes for agency_profiles
CREATE INDEX IF NOT EXISTS idx_agency_profiles_email ON agency_profiles(email);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_type ON agency_profiles(agency_type);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_seed_tag ON agency_profiles(seed_tag) WHERE seed_tag IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE landlord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;

-- Landlord profiles policies
CREATE POLICY "landlord_profiles_select_all" ON landlord_profiles
    FOR SELECT USING (true);

CREATE POLICY "landlord_profiles_insert_self" ON landlord_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "landlord_profiles_update_self" ON landlord_profiles
    FOR UPDATE USING (id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "landlord_profiles_delete_self" ON landlord_profiles
    FOR DELETE USING (id = auth.uid() OR auth.uid() IS NULL);

-- Renter profiles policies
CREATE POLICY "renter_profiles_select_all" ON renter_profiles
    FOR SELECT USING (true);

CREATE POLICY "renter_profiles_insert_self" ON renter_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "renter_profiles_update_self" ON renter_profiles
    FOR UPDATE USING (id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "renter_profiles_delete_self" ON renter_profiles
    FOR DELETE USING (id = auth.uid() OR auth.uid() IS NULL);

-- Agency profiles policies
CREATE POLICY "agency_profiles_select_all" ON agency_profiles
    FOR SELECT USING (true);

CREATE POLICY "agency_profiles_insert_self" ON agency_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "agency_profiles_update_self" ON agency_profiles
    FOR UPDATE USING (id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "agency_profiles_delete_self" ON agency_profiles
    FOR DELETE USING (id = auth.uid() OR auth.uid() IS NULL);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER landlord_profiles_updated_at
    BEFORE UPDATE ON landlord_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER renter_profiles_updated_at
    BEFORE UPDATE ON renter_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER agency_profiles_updated_at
    BEFORE UPDATE ON agency_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Base profile tables migration completed successfully!';
    RAISE NOTICE '  - Created landlord_profiles table';
    RAISE NOTICE '  - Created renter_profiles table';
    RAISE NOTICE '  - Created agency_profiles table';
    RAISE NOTICE '  - Added indexes and RLS policies';
    RAISE NOTICE '  - Added updated_at triggers';
END $$;
