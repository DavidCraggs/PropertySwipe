-- Run this in your Supabase SQL Editor to check if Row Level Security is blocking access
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('matches', 'properties', 'renter_profiles');

-- If RLS is enabled on matches, let's disable it temporarily for testing
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;

-- Then refresh your browser and check if the Matches page shows data
