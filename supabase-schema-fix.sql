-- =====================================================
-- DROP EXISTING TABLES (if they exist)
-- =====================================================
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS buyer_profiles CASCADE;
DROP TABLE IF EXISTS vendor_profiles CASCADE;

-- =====================================================
-- VENDOR PROFILES TABLE
-- =====================================================
CREATE TABLE vendor_profiles (
    id TEXT PRIMARY KEY,
    names TEXT NOT NULL,
    property_type TEXT NOT NULL,
    looking_for TEXT NOT NULL,
    preferred_purchase_type TEXT NOT NULL,
    estate_agent_link TEXT,
    property_id TEXT,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BUYER PROFILES TABLE
-- =====================================================
CREATE TABLE buyer_profiles (
    id TEXT PRIMARY KEY,
    situation TEXT NOT NULL,
    names TEXT NOT NULL,
    ages TEXT NOT NULL,
    local_area TEXT NOT NULL,
    buyer_type TEXT NOT NULL,
    purchase_type TEXT NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================
CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    vendor_id TEXT,

    -- Address
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    postcode TEXT NOT NULL,
    council TEXT,

    -- Basic Details
    price INTEGER NOT NULL CHECK (price > 0),
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0),
    property_type TEXT NOT NULL,
    square_footage INTEGER CHECK (square_footage > 0),
    year_built INTEGER CHECK (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM CURRENT_DATE)),

    -- Listing Details
    description TEXT NOT NULL,
    epc_rating TEXT NOT NULL CHECK (epc_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    tenure TEXT NOT NULL CHECK (tenure IN ('Freehold', 'Leasehold')),
    images TEXT[] NOT NULL,
    features TEXT[] NOT NULL,
    listing_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MATCHES TABLE
-- =====================================================
CREATE TABLE matches (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    vendor_id TEXT,
    buyer_id TEXT,

    -- Buyer information
    buyer_name TEXT NOT NULL,
    buyer_profile JSONB,

    -- Messages
    messages JSONB[] DEFAULT '{}',
    last_message_at TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0,

    -- Viewing details
    has_viewing_scheduled BOOLEAN DEFAULT FALSE,
    confirmed_viewing_date TIMESTAMPTZ,
    viewing_preference JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_properties_vendor_id ON properties(vendor_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_matches_property_id ON matches(property_id);
CREATE INDEX idx_matches_vendor_id ON matches(vendor_id);
CREATE INDEX idx_matches_buyer_id ON matches(buyer_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Public Access Policies (for demo - everyone can read/write)
-- In production, you'd want proper authentication-based policies

CREATE POLICY "Public access to vendor profiles" ON vendor_profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to buyer profiles" ON buyer_profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to properties" ON properties
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to matches" ON matches
    FOR ALL USING (true) WITH CHECK (true);
