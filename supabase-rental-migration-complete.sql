-- =====================================================
-- GETON RENTAL PLATFORM - COMPLETE DATABASE MIGRATION
-- Transforms purchasing platform to rental platform
-- Includes Renters' Rights Act 2025 compliance
-- =====================================================

-- BACKUP REMINDER: Always backup your database before running migrations!
-- To backup: pg_dump your_database > backup_$(date +%Y%m%d).sql

-- =====================================================
-- STEP 1: DROP EXISTING TABLES (Clean Slate)
-- =====================================================

DROP TABLE IF EXISTS hazard_reports CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS eviction_notices CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS user_ratings_summary CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS buyer_profiles CASCADE;
DROP TABLE IF EXISTS vendor_profiles CASCADE;
DROP TABLE IF EXISTS landlord_profiles CASCADE;
DROP TABLE IF EXISTS renter_profiles CASCADE;

-- =====================================================
-- STEP 2: CREATE LANDLORD PROFILES TABLE
-- =====================================================

CREATE TABLE landlord_profiles (
    id TEXT PRIMARY KEY,
    names TEXT NOT NULL CHECK (LENGTH(names) >= 2 AND LENGTH(names) <= 100),
    property_type TEXT NOT NULL CHECK (property_type IN ('Detached', 'Semi-detached', 'Terraced', 'End-Terraced', 'Bungalow', 'Flat')),

    -- Preferences (not discriminatory filters)
    furnishing_preference TEXT NOT NULL DEFAULT 'Unfurnished' CHECK (furnishing_preference IN ('Furnished', 'Part Furnished', 'Unfurnished')),
    preferred_tenant_types TEXT[] DEFAULT '{}', -- Array of RenterType values

    -- Pets policy (RRA 2025: must consider all requests)
    default_pets_policy JSONB DEFAULT '{
        "willConsiderPets": true,
        "requiresPetInsurance": false,
        "preferredPetTypes": [],
        "maxPetsAllowed": 2
    }'::jsonb,

    -- RRA 2025: PRS Database Registration (MANDATORY)
    prs_registration_number TEXT UNIQUE,
    prs_registration_status TEXT DEFAULT 'not_registered' CHECK (prs_registration_status IN ('not_registered', 'pending', 'active', 'expired', 'suspended')),
    prs_registration_date DATE,
    prs_registration_expiry_date DATE,

    -- RRA 2025: Ombudsman Membership (MANDATORY)
    ombudsman_scheme TEXT DEFAULT 'not_registered' CHECK (ombudsman_scheme IN ('not_registered', 'property_redress_scheme', 'property_ombudsman', 'tpo')),
    ombudsman_membership_number TEXT,

    -- Compliance check (calculated)
    is_fully_compliant BOOLEAN GENERATED ALWAYS AS (
        prs_registration_status = 'active' AND ombudsman_scheme != 'not_registered'
    ) STORED,

    -- Deposit scheme
    deposit_scheme TEXT CHECK (deposit_scheme IN ('DPS', 'MyDeposits', 'TDS', 'other')),
    is_registered_landlord BOOLEAN DEFAULT false,

    estate_agent_link TEXT,
    property_id TEXT, -- Linked property

    -- Rating aggregates
    average_rating DECIMAL(2,1) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_ratings INTEGER DEFAULT 0 CHECK (total_ratings >= 0),

    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for landlord_profiles
CREATE INDEX idx_landlord_prs_status ON landlord_profiles(prs_registration_status);
CREATE INDEX idx_landlord_compliance ON landlord_profiles(is_fully_compliant) WHERE is_fully_compliant = true;
CREATE INDEX idx_landlord_property ON landlord_profiles(property_id) WHERE property_id IS NOT NULL;

COMMENT ON TABLE landlord_profiles IS 'Landlord profiles (formerly vendor_profiles) - RRA 2025 compliant';
COMMENT ON COLUMN landlord_profiles.is_fully_compliant IS 'Auto-calculated: true if PRS registered AND ombudsman member';

-- =====================================================
-- STEP 3: CREATE RENTER PROFILES TABLE
-- =====================================================

CREATE TABLE renter_profiles (
    id TEXT PRIMARY KEY,
    situation TEXT NOT NULL CHECK (situation IN ('Single', 'Couple', 'Family', 'Professional Sharers')),
    names TEXT NOT NULL CHECK (LENGTH(names) >= 2 AND LENGTH(names) <= 100),
    ages TEXT NOT NULL,
    local_area TEXT NOT NULL CHECK (local_area IN ('Southport', 'Liverpool', 'Manchester')),

    -- Rental-specific
    renter_type TEXT NOT NULL CHECK (renter_type IN ('Student', 'Young Professional', 'Family', 'Couple', 'Professional Sharers', 'Retired')),
    employment_status TEXT NOT NULL CHECK (employment_status IN ('Employed Full-Time', 'Employed Part-Time', 'Self-Employed', 'Student', 'Retired', 'Unemployed', 'Contract Worker')),
    monthly_income INTEGER CHECK (monthly_income >= 0), -- For affordability, not discrimination

    -- Pets
    has_pets BOOLEAN DEFAULT false,
    pet_details JSONB DEFAULT '[]'::jsonb, -- Array of pet objects
    smoking_status TEXT DEFAULT 'Non-Smoker' CHECK (smoking_status IN ('Non-Smoker', 'Smoker', 'Vaper')),

    -- Rental history
    has_guarantor BOOLEAN DEFAULT false,
    preferred_move_in_date DATE,
    current_rental_situation TEXT CHECK (current_rental_situation IN ('Living with Parents', 'Currently Renting', 'Homeowner', 'Student Accommodation')),
    has_rental_history BOOLEAN DEFAULT false,
    previous_landlord_reference BOOLEAN DEFAULT false,

    -- Protected characteristics (RRA 2025: CANNOT be used for discrimination)
    receives_housing_benefit BOOLEAN DEFAULT false,
    receives_universal_credit BOOLEAN DEFAULT false,
    number_of_children INTEGER DEFAULT 0 CHECK (number_of_children >= 0),

    -- Rating aggregates
    average_rating DECIMAL(2,1) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_ratings INTEGER DEFAULT 0 CHECK (total_ratings >= 0),

    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for renter_profiles
CREATE INDEX idx_renter_local_area ON renter_profiles(local_area);
CREATE INDEX idx_renter_employment ON renter_profiles(employment_status);
CREATE INDEX idx_renter_type ON renter_profiles(renter_type);

COMMENT ON TABLE renter_profiles IS 'Renter profiles (formerly buyer_profiles) - with protected characteristics tracking';
COMMENT ON COLUMN renter_profiles.receives_housing_benefit IS 'Protected characteristic - CANNOT be used to refuse tenancy (RRA 2025)';
COMMENT ON COLUMN renter_profiles.number_of_children IS 'Protected characteristic - CANNOT be used to refuse tenancy (RRA 2025)';

-- =====================================================
-- STEP 4: CREATE PROPERTIES TABLE (RENTAL)
-- =====================================================

CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    landlord_id TEXT, -- Foreign key to landlord_profiles

    -- Address
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    postcode TEXT NOT NULL,
    council TEXT,

    -- Rental pricing (NOT purchase price)
    rent_pcm INTEGER NOT NULL CHECK (rent_pcm >= 100 AND rent_pcm <= 10000), -- Monthly rent in GBP
    deposit INTEGER NOT NULL CHECK (deposit >= 0), -- Typically 5 weeks rent

    -- Property details
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0 AND bedrooms <= 20),
    bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0 AND bathrooms <= 10),
    property_type TEXT NOT NULL CHECK (property_type IN ('Detached', 'Semi-detached', 'Terraced', 'End-Terraced', 'Bungalow', 'Flat')),
    year_built INTEGER CHECK (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),

    -- Listing details
    description TEXT NOT NULL CHECK (LENGTH(description) >= 50),
    epc_rating TEXT NOT NULL CHECK (epc_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    images TEXT[] NOT NULL CHECK (array_length(images, 1) >= 1), -- At least 1 image
    features TEXT[] NOT NULL DEFAULT '{}',

    -- Rental-specific
    furnishing TEXT NOT NULL DEFAULT 'Unfurnished' CHECK (furnishing IN ('Furnished', 'Part Furnished', 'Unfurnished')),
    available_from DATE NOT NULL DEFAULT CURRENT_DATE,
    tenancy_type TEXT NOT NULL DEFAULT 'Periodic' CHECK (tenancy_type = 'Periodic'), -- RRA 2025: Only periodic allowed
    max_occupants INTEGER NOT NULL CHECK (max_occupants >= 1 AND max_occupants <= 20),

    -- Pets policy (RRA 2025: must consider)
    pets_policy JSONB NOT NULL DEFAULT '{
        "willConsiderPets": true,
        "preferredPetTypes": [],
        "requiresPetInsurance": false,
        "maxPetsAllowed": 2
    }'::jsonb,

    -- Bills
    council_tax_band TEXT CHECK (council_tax_band IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
    gas_electric_included BOOLEAN DEFAULT false,
    water_included BOOLEAN DEFAULT false,
    internet_included BOOLEAN DEFAULT false,

    -- Compliance (RRA 2025)
    meets_decent_homes_standard BOOLEAN DEFAULT false,
    awaabs_law_compliant BOOLEAN DEFAULT false,
    last_safety_inspection_date DATE,

    -- PRS Database (RRA 2025: MANDATORY)
    prs_property_registration_number TEXT UNIQUE,
    prs_property_registration_status TEXT DEFAULT 'not_registered' CHECK (prs_property_registration_status IN ('not_registered', 'active', 'suspended')),

    -- Calculated: can only market if compliant
    can_be_marketed BOOLEAN GENERATED ALWAYS AS (
        prs_property_registration_status = 'active'
        AND meets_decent_homes_standard = true
        AND awaabs_law_compliant = true
    ) STORED,

    -- Availability
    is_available BOOLEAN DEFAULT true,
    listing_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- RRA 2025: Preferences (non-enforceable)
    preferred_minimum_stay INTEGER CHECK (preferred_minimum_stay >= 1 AND preferred_minimum_stay <= 24), -- months
    accepts_short_term_tenants BOOLEAN DEFAULT true,

    -- RRA 2025: Rent protection (no bidding, 1 month max advance)
    max_rent_in_advance INTEGER DEFAULT 1 CHECK (max_rent_in_advance = 1), -- Fixed by law

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for properties
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_rent ON properties(rent_pcm);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX idx_properties_available ON properties(is_available) WHERE is_available = true;
CREATE INDEX idx_properties_marketable ON properties(can_be_marketed) WHERE can_be_marketed = true;
CREATE INDEX idx_properties_prs_status ON properties(prs_property_registration_status);

COMMENT ON TABLE properties IS 'Rental properties - RRA 2025 compliant (periodic tenancies only)';
COMMENT ON COLUMN properties.rent_pcm IS 'Monthly rent in GBP (RRA 2025: no rent bidding allowed)';
COMMENT ON COLUMN properties.tenancy_type IS 'Always Periodic per RRA 2025 (fixed terms abolished)';
COMMENT ON COLUMN properties.max_rent_in_advance IS 'Fixed at 1 month by RRA 2025';

-- Trigger to prevent marketing non-compliant properties
CREATE OR REPLACE FUNCTION check_property_compliance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_available = true AND NEW.can_be_marketed = false THEN
        RAISE EXCEPTION 'Cannot market property without valid PRS registration and compliance certifications (RRA 2025)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_property_compliance
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION check_property_compliance();

-- =====================================================
-- STEP 5: CREATE MATCHES TABLE (RENTAL)
-- =====================================================

CREATE TABLE matches (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    landlord_id TEXT NOT NULL,
    renter_id TEXT NOT NULL,
    renter_name TEXT NOT NULL,
    renter_profile JSONB, -- Full profile snapshot

    -- Messages
    messages JSONB DEFAULT '[]'::jsonb,
    last_message_at TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0 CHECK (unread_count >= 0),

    -- Viewing
    viewing_preference JSONB,
    has_viewing_scheduled BOOLEAN DEFAULT false,
    confirmed_viewing_date TIMESTAMPTZ,

    -- Application status (rental-specific)
    application_status TEXT DEFAULT 'pending' CHECK (application_status IN (
        'pending', 'viewing_requested', 'viewing_completed', 'application_submitted',
        'referencing', 'offer_made', 'offer_accepted', 'tenancy_signed', 'declined', 'withdrawn'
    )),
    application_submitted_at TIMESTAMPTZ,

    -- Tenancy (RRA 2025: periodic only, no fixed end date)
    tenancy_start_date DATE,
    tenancy_noticed_date DATE, -- When 2 months notice given
    expected_move_out_date DATE GENERATED ALWAYS AS (tenancy_noticed_date + INTERVAL '56 days') STORED, -- 2 months = 56 days
    tenancy_completed_at TIMESTAMPTZ,
    tenancy_end_reason TEXT, -- 'tenant_notice' or eviction ground

    -- Ratings
    can_rate BOOLEAN DEFAULT false,
    has_renter_rated BOOLEAN DEFAULT false,
    has_landlord_rated BOOLEAN DEFAULT false,
    renter_rating_id TEXT,
    landlord_rating_id TEXT,

    -- Eviction tracking
    is_under_eviction_proceedings BOOLEAN DEFAULT false,

    -- Rent tracking (for Ground 8 evictions)
    rent_arrears JSONB DEFAULT '{
        "totalOwed": 0,
        "monthsMissed": 0,
        "consecutiveMonthsMissed": 0
    }'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for matches
CREATE INDEX idx_matches_landlord ON matches(landlord_id);
CREATE INDEX idx_matches_renter ON matches(renter_id);
CREATE INDEX idx_matches_property ON matches(property_id);
CREATE INDEX idx_matches_can_rate ON matches(can_rate) WHERE can_rate = true;
CREATE INDEX idx_matches_application_status ON matches(application_status);
CREATE INDEX idx_matches_tenancy_active ON matches(tenancy_start_date, tenancy_completed_at) WHERE tenancy_start_date IS NOT NULL AND tenancy_completed_at IS NULL;

COMMENT ON TABLE matches IS 'Matches between renters and landlords - rental-specific workflow';
COMMENT ON COLUMN matches.tenancy_noticed_date IS 'When tenant or landlord gave 2 months notice (RRA 2025)';
COMMENT ON COLUMN matches.expected_move_out_date IS 'Auto-calculated: noticed_date + 56 days';

-- =====================================================
-- STEP 6: CREATE RATINGS TABLE (BIDIRECTIONAL)
-- =====================================================

CREATE TABLE ratings (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    from_user_type TEXT NOT NULL CHECK (from_user_type IN ('landlord', 'renter')),
    to_user_id TEXT NOT NULL,
    to_user_type TEXT NOT NULL CHECK (to_user_type IN ('landlord', 'renter')),
    property_id TEXT NOT NULL,

    -- Overall rating
    overall_score INTEGER NOT NULL CHECK (overall_score >= 1 AND overall_score <= 5),

    -- Category scores
    communication_score INTEGER NOT NULL CHECK (communication_score >= 1 AND communication_score <= 5),
    cleanliness_score INTEGER NOT NULL CHECK (cleanliness_score >= 1 AND cleanliness_score <= 5),
    reliability_score INTEGER NOT NULL CHECK (reliability_score >= 1 AND reliability_score <= 5),
    property_condition_score INTEGER CHECK (property_condition_score >= 1 AND property_condition_score <= 5), -- Renter rating landlord only
    respect_for_property_score INTEGER CHECK (respect_for_property_score >= 1 AND respect_for_property_score <= 5), -- Landlord rating renter only

    -- Review text
    review TEXT NOT NULL CHECK (LENGTH(review) >= 50 AND LENGTH(review) <= 1000),
    would_recommend BOOLEAN NOT NULL,

    -- Tenancy info
    tenancy_start_date DATE NOT NULL,
    tenancy_end_date DATE NOT NULL,
    is_verified BOOLEAN DEFAULT false, -- Admin verified this was a real tenancy

    -- Moderation
    reported_at TIMESTAMPTZ,
    report_reason TEXT,
    is_hidden BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(match_id, from_user_id), -- Prevent duplicate ratings
    CHECK (tenancy_end_date > tenancy_start_date), -- Valid date range
    CHECK (
        -- Renter rating landlord must have property_condition_score
        (from_user_type = 'renter' AND property_condition_score IS NOT NULL AND respect_for_property_score IS NULL)
        OR
        -- Landlord rating renter must have respect_for_property_score
        (from_user_type = 'landlord' AND respect_for_property_score IS NOT NULL AND property_condition_score IS NULL)
    )
);

-- Indexes for ratings
CREATE INDEX idx_ratings_to_user ON ratings(to_user_id, to_user_type);
CREATE INDEX idx_ratings_from_user ON ratings(from_user_id, from_user_type);
CREATE INDEX idx_ratings_property ON ratings(property_id);
CREATE INDEX idx_ratings_verified ON ratings(is_verified) WHERE is_verified = true;
CREATE INDEX idx_ratings_visible ON ratings(is_hidden) WHERE is_hidden = false;
CREATE INDEX idx_ratings_match ON ratings(match_id);

COMMENT ON TABLE ratings IS 'Bidirectional rating system for renters and landlords';
COMMENT ON COLUMN ratings.property_condition_score IS 'Only for renter rating landlord';
COMMENT ON COLUMN ratings.respect_for_property_score IS 'Only for landlord rating renter';
COMMENT ON COLUMN ratings.is_verified IS 'Admin verified this tenancy actually occurred';

-- =====================================================
-- STEP 7: CREATE EVICTION NOTICES TABLE (RRA 2025)
-- =====================================================

CREATE TABLE eviction_notices (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    landlord_id TEXT NOT NULL,
    renter_id TEXT NOT NULL,
    property_id TEXT NOT NULL,

    -- Ground (Section 8 only - Section 21 abolished)
    ground TEXT NOT NULL CHECK (ground IN (
        'ground_8', 'ground_7a', 'ground_1', 'ground_1a', 'ground_6',
        'ground_14', 'ground_14a', 'ground_14za', 'ground_17'
    )),

    -- Notice details
    notice_served_date DATE NOT NULL,
    earliest_possession_date DATE NOT NULL,
    reason TEXT NOT NULL CHECK (LENGTH(reason) >= 100), -- Detailed explanation required
    evidence TEXT[] NOT NULL CHECK (array_length(evidence, 1) >= 1), -- Supporting documents required

    -- Status
    status TEXT DEFAULT 'served' CHECK (status IN (
        'served', 'challenged', 'court_hearing_scheduled', 'possession_granted', 'possession_denied'
    )),
    court_hearing_date DATE,
    outcome_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (earliest_possession_date > notice_served_date),
    CHECK (
        -- Ground 8: 28 days notice (4 weeks)
        (ground = 'ground_8' AND earliest_possession_date >= notice_served_date + INTERVAL '28 days')
        OR
        -- Grounds 1, 1A, 6, 14: 56 days notice (8 weeks / 2 months)
        (ground IN ('ground_1', 'ground_1a', 'ground_6', 'ground_14') AND earliest_possession_date >= notice_served_date + INTERVAL '56 days')
        OR
        -- Other grounds: 28 days minimum
        (ground NOT IN ('ground_8', 'ground_1', 'ground_1a', 'ground_6', 'ground_14') AND earliest_possession_date >= notice_served_date + INTERVAL '28 days')
    )
);

-- Indexes for eviction_notices
CREATE INDEX idx_eviction_match ON eviction_notices(match_id);
CREATE INDEX idx_eviction_landlord ON eviction_notices(landlord_id);
CREATE INDEX idx_eviction_renter ON eviction_notices(renter_id);
CREATE INDEX idx_eviction_property ON eviction_notices(property_id);
CREATE INDEX idx_eviction_status ON eviction_notices(status);
CREATE INDEX idx_eviction_ground ON eviction_notices(ground);

COMMENT ON TABLE eviction_notices IS 'Section 8 eviction notices (Section 21 abolished by RRA 2025)';
COMMENT ON COLUMN eviction_notices.ground IS 'Legal ground for eviction (Section 8 Housing Act 1988)';
COMMENT ON COLUMN eviction_notices.earliest_possession_date IS 'Calculated based on ground: 28 or 56 days notice required';

-- =====================================================
-- STEP 8: CREATE HAZARD REPORTS TABLE (Awaab's Law)
-- =====================================================

CREATE TABLE hazard_reports (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    property_id TEXT NOT NULL,

    -- Report details
    reported_by TEXT NOT NULL CHECK (reported_by IN ('renter', 'inspection')),
    hazard_type TEXT NOT NULL CHECK (hazard_type IN (
        'damp_mould', 'gas_safety', 'fire_safety', 'electrical', 'structural', 'pest_infestation', 'other'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('immediate', 'serious', 'moderate')),
    description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
    photos TEXT[] DEFAULT '{}',

    -- Timeline
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    landlord_notified_at TIMESTAMPTZ,
    deadline DATE NOT NULL, -- 14 days for most, immediate for serious
    fixed_at TIMESTAMPTZ,
    is_overdue BOOLEAN GENERATED ALWAYS AS (fixed_at IS NULL AND deadline < CURRENT_DATE) STORED,

    -- Enforcement
    local_authority_notified_at TIMESTAMPTZ,
    penalty_issued JSONB, -- {amount: number, reason: string}

    -- Constraints
    CHECK (
        -- Immediate severity: deadline same day
        (severity = 'immediate' AND deadline = reported_at::date)
        OR
        -- Serious severity: deadline within 7 days
        (severity = 'serious' AND deadline <= reported_at::date + INTERVAL '7 days')
        OR
        -- Moderate severity: deadline within 14 days (Awaab's Law)
        (severity = 'moderate' AND deadline <= reported_at::date + INTERVAL '14 days')
    )
);

-- Indexes for hazard_reports
CREATE INDEX idx_hazard_match ON hazard_reports(match_id);
CREATE INDEX idx_hazard_property ON hazard_reports(property_id);
CREATE INDEX idx_hazard_overdue ON hazard_reports(is_overdue) WHERE is_overdue = true;
CREATE INDEX idx_hazard_severity ON hazard_reports(severity);
CREATE INDEX idx_hazard_type ON hazard_reports(hazard_type);

COMMENT ON TABLE hazard_reports IS 'Property hazards (Decent Homes Standard & Awaabs Law compliance)';
COMMENT ON COLUMN hazard_reports.deadline IS 'Auto-calculated: 0 days (immediate), 7 days (serious), or 14 days (moderate)';
COMMENT ON COLUMN hazard_reports.is_overdue IS 'Auto-calculated: true if not fixed by deadline';

-- =====================================================
-- STEP 9: CREATE DISPUTES TABLE (Ombudsman)
-- =====================================================

CREATE TABLE disputes (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    landlord_id TEXT NOT NULL,
    renter_id TEXT NOT NULL,
    property_id TEXT NOT NULL,

    -- Dispute details
    raised_by TEXT NOT NULL CHECK (raised_by IN ('renter', 'landlord')),
    category TEXT NOT NULL CHECK (category IN (
        'repairs', 'deposit', 'rent_increase', 'harassment', 'illegal_eviction', 'discrimination', 'other'
    )),
    description TEXT NOT NULL CHECK (LENGTH(description) >= 50),
    evidence TEXT[] DEFAULT '{}',
    desired_outcome TEXT NOT NULL,

    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open', 'investigating', 'mediation', 'resolved', 'escalated_to_ombudsman'
    )),
    resolution TEXT,
    compensation_awarded INTEGER CHECK (compensation_awarded >= 0),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Indexes for disputes
CREATE INDEX idx_dispute_match ON disputes(match_id);
CREATE INDEX idx_dispute_landlord ON disputes(landlord_id);
CREATE INDEX idx_dispute_renter ON disputes(renter_id);
CREATE INDEX idx_dispute_property ON disputes(property_id);
CREATE INDEX idx_dispute_status ON disputes(status);
CREATE INDEX idx_dispute_category ON disputes(category);
CREATE INDEX idx_dispute_open ON disputes(status) WHERE status IN ('open', 'investigating', 'mediation');

COMMENT ON TABLE disputes IS 'Dispute resolution system (required by Private Rented Sector Ombudsman scheme)';
COMMENT ON COLUMN disputes.status IS 'Auto-escalates to ombudsman if unresolved after 8 weeks';

-- =====================================================
-- STEP 10: CREATE RATING AGGREGATES MATERIALIZED VIEW
-- =====================================================

CREATE MATERIALIZED VIEW user_ratings_summary AS
SELECT
    to_user_id as user_id,
    to_user_type as user_type,
    COUNT(*) as total_ratings,
    ROUND(AVG(overall_score)::numeric, 1) as average_overall_score,
    ROUND(AVG(communication_score)::numeric, 1) as average_communication,
    ROUND(AVG(cleanliness_score)::numeric, 1) as average_cleanliness,
    ROUND(AVG(reliability_score)::numeric, 1) as average_reliability,
    ROUND(AVG(property_condition_score)::numeric, 1) as average_property_condition,
    ROUND(AVG(respect_for_property_score)::numeric, 1) as average_respect_for_property,
    ROUND(100.0 * SUM(CASE WHEN would_recommend THEN 1 ELSE 0 END)::numeric / COUNT(*), 1) as would_recommend_percentage,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_tenancies
FROM ratings
WHERE is_hidden = false
GROUP BY to_user_id, to_user_type;

-- Index on materialized view
CREATE UNIQUE INDEX idx_user_ratings_summary ON user_ratings_summary(user_id, user_type);

COMMENT ON MATERIALIZED VIEW user_ratings_summary IS 'Aggregate rating statistics per user - refresh after rating changes';

-- Function to refresh ratings summary
CREATE OR REPLACE FUNCTION refresh_ratings_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_ratings_summary;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 11: TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update user rating aggregates after rating insert
CREATE OR REPLACE FUNCTION update_user_rating_aggregate()
RETURNS TRIGGER AS $$
BEGIN
    -- Update renter or landlord profile aggregate rating
    IF NEW.to_user_type = 'renter' THEN
        UPDATE renter_profiles
        SET
            average_rating = (
                SELECT ROUND(AVG(overall_score)::numeric, 1)
                FROM ratings
                WHERE to_user_id = NEW.to_user_id
                AND to_user_type = 'renter'
                AND is_hidden = false
            ),
            total_ratings = (
                SELECT COUNT(*)
                FROM ratings
                WHERE to_user_id = NEW.to_user_id
                AND to_user_type = 'renter'
                AND is_hidden = false
            )
        WHERE id = NEW.to_user_id;
    ELSIF NEW.to_user_type = 'landlord' THEN
        UPDATE landlord_profiles
        SET
            average_rating = (
                SELECT ROUND(AVG(overall_score)::numeric, 1)
                FROM ratings
                WHERE to_user_id = NEW.to_user_id
                AND to_user_type = 'landlord'
                AND is_hidden = false
            ),
            total_ratings = (
                SELECT COUNT(*)
                FROM ratings
                WHERE to_user_id = NEW.to_user_id
                AND to_user_type = 'landlord'
                AND is_hidden = false
            )
        WHERE id = NEW.to_user_id;
    END IF;

    -- Mark match as rated
    IF NEW.from_user_type = 'renter' THEN
        UPDATE matches
        SET has_renter_rated = true, renter_rating_id = NEW.id
        WHERE id = NEW.match_id;
    ELSIF NEW.from_user_type = 'landlord' THEN
        UPDATE matches
        SET has_landlord_rated = true, landlord_rating_id = NEW.id
        WHERE id = NEW.match_id;
    END IF;

    -- Refresh materialized view
    PERFORM refresh_ratings_summary();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on ratings insert
CREATE TRIGGER trigger_update_rating_aggregate
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating_aggregate();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for properties updated_at
CREATE TRIGGER trigger_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 12: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE landlord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE eviction_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Ratings: Users can read all non-hidden ratings
CREATE POLICY "Users can read all non-hidden ratings"
ON ratings FOR SELECT
USING (is_hidden = false);

-- Ratings: Users can create ratings for their own matches
CREATE POLICY "Users can create ratings for their own matches"
ON ratings FOR INSERT
WITH CHECK (
    from_user_id = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM matches
        WHERE id = match_id
        AND (renter_id = auth.uid()::text OR landlord_id = auth.uid()::text)
        AND can_rate = true
    )
);

-- Ratings: Cannot be updated (immutable)
CREATE POLICY "Ratings cannot be updated"
ON ratings FOR UPDATE
USING (false);

-- Properties: Anyone can read marketable properties
CREATE POLICY "Anyone can read marketable properties"
ON properties FOR SELECT
USING (can_be_marketed = true AND is_available = true);

-- Properties: Landlords can manage their own properties
CREATE POLICY "Landlords can manage their own properties"
ON properties FOR ALL
USING (landlord_id = auth.uid()::text);

-- Matches: Users can see their own matches
CREATE POLICY "Users can see their own matches"
ON matches FOR SELECT
USING (landlord_id = auth.uid()::text OR renter_id = auth.uid()::text);

-- Hazard reports: Renters can create for their tenancies
CREATE POLICY "Renters can create hazard reports"
ON hazard_reports FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM matches
        WHERE id = match_id
        AND renter_id = auth.uid()::text
        AND tenancy_start_date IS NOT NULL
    )
);

-- Disputes: Users can create for their matches
CREATE POLICY "Users can create disputes"
ON disputes FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM matches
        WHERE id = match_id
        AND (renter_id = auth.uid()::text OR landlord_id = auth.uid()::text)
    )
);

COMMENT ON POLICY "Users can read all non-hidden ratings" ON ratings IS 'Public ratings for transparency';
COMMENT ON POLICY "Ratings cannot be updated" ON ratings IS 'Immutable to prevent gaming the system';

-- =====================================================
-- STEP 13: DATA VALIDATION CHECKS
-- =====================================================

-- Add constraint to ensure deposit is reasonable (typically 5 weeks rent)
ALTER TABLE properties
ADD CONSTRAINT check_deposit_reasonable
CHECK (deposit <= rent_pcm * 1.5); -- Max 6 weeks (typical max is 5)

-- Add constraint to ensure rent is affordable based on income
-- (This would be enforced in application layer based on 2.5x rule)

-- =====================================================
-- STEP 14: SEED DATA (Optional - for testing)
-- =====================================================

-- You can insert test landlord profiles, properties, etc. here if needed

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify indexes created
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verify triggers created
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

COMMENT ON SCHEMA public IS 'GetOn Rental Platform - RRA 2025 Compliant';

-- End of migration
