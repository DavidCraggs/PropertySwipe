-- Clear all test data from Supabase tables
-- Run this in the Supabase SQL Editor to remove old test data
-- This is necessary before running the seed data script

-- Delete in dependency order (child tables first)
DELETE FROM ratings WHERE TRUE;
DELETE FROM issues WHERE TRUE;
DELETE FROM matches WHERE TRUE;
DELETE FROM agency_property_links WHERE TRUE;
DELETE FROM properties WHERE TRUE;
DELETE FROM renter_profiles WHERE TRUE;
DELETE FROM landlord_profiles WHERE TRUE;
DELETE FROM agency_profiles WHERE TRUE;

-- Verify deletion
SELECT 
    'renter_profiles' as table_name, COUNT(*) as remaining_records FROM renter_profiles
UNION ALL
SELECT 'landlord_profiles', COUNT(*) FROM landlord_profiles
UNION ALL
SELECT 'agency_profiles', COUNT(*) FROM agency_profiles
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'issues', COUNT(*) FROM issues
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL
SELECT 'agency_property_links', COUNT(*) FROM agency_property_links;
