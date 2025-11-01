-- =====================================================
-- Get On - Supabase Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VENDOR PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    names TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('Detached', 'Semi-detached', 'Terraced', 'Flat', 'Bungalow')),
    looking_for TEXT NOT NULL CHECK (looking_for IN ('Family', 'Investor')),
    preferred_purchase_type TEXT NOT NULL CHECK (preferred_purchase_type IN ('Cash', 'Mortgage', 'Both')),
    estate_agent_link TEXT,
    property_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_complete BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- BUYER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS buyer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    situation TEXT NOT NULL,
    names TEXT NOT NULL,
    ages TEXT NOT NULL,
    local_area TEXT NOT NULL,
    buyer_type TEXT NOT NULL,
    purchase_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_complete BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE SET NULL,

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
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES buyer_profiles(id) ON DELETE CASCADE,

    -- Buyer information
    buyer_name TEXT NOT NULL,
    buyer_profile JSONB, -- Full buyer profile for vendor to see

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
CREATE INDEX IF NOT EXISTS idx_properties_vendor_id ON properties(vendor_id);
CREATE INDEX IF NOT EXISTS idx_properties_postcode ON properties(postcode);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_matches_vendor_id ON matches(vendor_id);
CREATE INDEX IF NOT EXISTS idx_matches_buyer_id ON matches(buyer_id);
CREATE INDEX IF NOT EXISTS idx_matches_property_id ON matches(property_id);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for demo (anyone can do anything)
-- In production, you'd restrict this based on auth.uid()

CREATE POLICY "Allow all operations on vendor_profiles for demo"
    ON vendor_profiles FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on buyer_profiles for demo"
    ON buyer_profiles FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on properties for demo"
    ON properties FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on matches for demo"
    ON matches FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKET FOR IMAGES
-- =====================================================
-- This needs to be done in the Supabase Storage UI:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a new bucket called "property-images"
-- 3. Make it public
-- 4. Set max file size to 5MB

-- Storage policy (run this after creating the bucket)
-- CREATE POLICY "Public Access"
--     ON storage.objects FOR ALL
--     USING (bucket_id = 'property-images');

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment to insert sample data

-- INSERT INTO vendor_profiles (names, property_type, looking_for, preferred_purchase_type) VALUES
-- ('John Smith', 'Detached', 'Family', 'Both');

-- INSERT INTO buyer_profiles (situation, names, ages, local_area, buyer_type, purchase_type) VALUES
-- ('Couple', 'Jane & Mike', '32 & 29', 'Yes', 'First Time Buyer', 'Mortgage');
