-- =====================================================
-- FIX: Landlord Profiles RLS Policy
-- Allows renters to read landlord profile information
-- (needed for displaying landlord contact info on tenant dashboard)
-- =====================================================

-- First, check current RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'landlord_profiles';

-- Check existing policies
SELECT polname, polcmd, polroles::regrole[], polqual
FROM pg_policy
WHERE polrelid = 'landlord_profiles'::regclass;

-- Option 1: QUICK FIX - Disable RLS temporarily (for development only!)
-- ALTER TABLE landlord_profiles DISABLE ROW LEVEL SECURITY;

-- Option 2: PROPER FIX - Add SELECT policy to allow all authenticated users to read
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "landlord_profiles_select_all" ON landlord_profiles;
DROP POLICY IF EXISTS "landlord_profiles_public_read" ON landlord_profiles;
DROP POLICY IF EXISTS "Anyone can read landlord profiles" ON landlord_profiles;

-- Create a permissive SELECT policy - anyone can read landlord profiles
-- This is needed because:
-- 1. Renters need to see their landlord's name/contact on their dashboard
-- 2. Agencies need to see landlord info for properties they manage
-- 3. Other landlords may need to see profiles in some contexts
CREATE POLICY "landlord_profiles_select_all" ON landlord_profiles
    FOR SELECT
    USING (true);

-- Verify the policy was created
SELECT polname, polcmd, polroles::regrole[]
FROM pg_policy
WHERE polrelid = 'landlord_profiles'::regclass;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Landlord profiles RLS policy updated successfully!';
    RAISE NOTICE 'SELECT access is now allowed for all users.';
END $$;
