-- COMPREHENSIVE Clear Script for PropertySwipe Test Data
-- Run this in Supabase SQL Editor to completely wipe all data
-- This uses CASCADE to handle all foreign key relationships automatically

-- Disable triggers temporarily to avoid constraint issues
SET session_replication_role = 'replica';

-- Delete all data from all tables (CASCADE handles dependencies)
TRUNCATE TABLE 
    email_notifications,
    ratings,
    issues,
    matches,
    agency_property_links,
    agency_link_invitations,
    properties,
    agency_profiles,
    landlord_profiles,
    renter_profiles
CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify all tables are empty
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
SELECT 'agency_property_links', COUNT(*) FROM agency_property_links
UNION ALL
SELECT 'agency_link_invitations', COUNT(*) FROM agency_link_invitations
UNION ALL
SELECT 'email_notifications', COUNT(*) FROM email_notifications
ORDER BY table_name;
