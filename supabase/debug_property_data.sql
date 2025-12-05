-- Debug query to see what property data exists for the landlord
-- Run this in Supabase SQL Editor to see the actual property data

SELECT 
    id,
    street,
    city,
    postcode,
    council,
    property_type,
    bedrooms,
    bathrooms,
    rent_pcm,
    description,
    epc_rating,
    landlord_id
FROM properties
ORDER BY created_at DESC
LIMIT 5;

-- Also check landlord profile to see which property is linked
SELECT 
    id,
    email,
    names,
    property_id
FROM landlord_profiles
ORDER BY created_at DESC
LIMIT 5;
