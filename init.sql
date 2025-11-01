-- Initialize Get On Database Schema

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vendor Profiles Table
CREATE TABLE vendor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    names VARCHAR(255) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    looking_for VARCHAR(50) NOT NULL,
    preferred_purchase_type VARCHAR(50) NOT NULL,
    estate_agent_link TEXT,
    property_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_complete BOOLEAN DEFAULT TRUE
);

-- Buyer Profiles Table
CREATE TABLE buyer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    situation VARCHAR(50) NOT NULL,
    names VARCHAR(255) NOT NULL,
    ages VARCHAR(50) NOT NULL,
    local_area VARCHAR(50) NOT NULL,
    buyer_type VARCHAR(50) NOT NULL,
    purchase_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_complete BOOLEAN DEFAULT TRUE
);

-- Properties Table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE SET NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    council VARCHAR(100),
    price INTEGER NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    square_footage INTEGER,
    year_built INTEGER,
    description TEXT NOT NULL,
    epc_rating VARCHAR(5) NOT NULL,
    tenure VARCHAR(20) NOT NULL,
    images TEXT[] NOT NULL,
    features TEXT[] NOT NULL,
    listing_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches Table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendor_profiles(id),
    buyer_id UUID REFERENCES buyer_profiles(id),
    buyer_name VARCHAR(255),
    buyer_profile JSONB,
    messages JSONB[] DEFAULT '{}',
    has_viewing_scheduled BOOLEAN DEFAULT FALSE,
    confirmed_viewing_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_properties_vendor_id ON properties(vendor_id);
CREATE INDEX idx_properties_postcode ON properties(postcode);
CREATE INDEX idx_matches_vendor_id ON matches(vendor_id);
CREATE INDEX idx_matches_buyer_id ON matches(buyer_id);
CREATE INDEX idx_matches_property_id ON matches(property_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO geton;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO geton;
