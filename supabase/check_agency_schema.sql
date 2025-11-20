-- Check if seed_tag column exists in agency_profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'agency_profiles'
ORDER BY ordinal_position;
