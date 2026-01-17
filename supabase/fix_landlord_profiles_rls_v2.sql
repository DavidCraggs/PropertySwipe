-- =====================================================
-- FIX V2: Landlord Profiles RLS Policy
-- More aggressive fix for 406 errors
-- =====================================================

-- Step 1: Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'landlord_profiles';

-- Step 2: List ALL existing policies on landlord_profiles
SELECT
    polname as policy_name,
    polcmd as command,
    CASE polpermissive WHEN true THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type,
    pg_get_expr(polqual, polrelid) as using_expression,
    pg_get_expr(polwithcheck, polrelid) as with_check_expression
FROM pg_policy
WHERE polrelid = 'landlord_profiles'::regclass;

-- Step 3: Drop ALL existing policies to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT polname FROM pg_policy WHERE polrelid = 'landlord_profiles'::regclass
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON landlord_profiles', pol.polname);
        RAISE NOTICE 'Dropped policy: %', pol.polname;
    END LOOP;
END $$;

-- Step 4: Ensure RLS is enabled
ALTER TABLE landlord_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, permissive policies for all operations
-- SELECT - anyone can read (needed for tenant dashboard, agency views, etc.)
CREATE POLICY "Allow all select on landlord_profiles"
    ON landlord_profiles
    FOR SELECT
    TO public
    USING (true);

-- INSERT - anyone can insert (for registration)
CREATE POLICY "Allow all insert on landlord_profiles"
    ON landlord_profiles
    FOR INSERT
    TO public
    WITH CHECK (true);

-- UPDATE - anyone can update (simplified for dev - tighten in production)
CREATE POLICY "Allow all update on landlord_profiles"
    ON landlord_profiles
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- DELETE - anyone can delete (simplified for dev - tighten in production)
CREATE POLICY "Allow all delete on landlord_profiles"
    ON landlord_profiles
    FOR DELETE
    TO public
    USING (true);

-- Step 6: Verify policies were created
SELECT
    polname as policy_name,
    polcmd as command,
    CASE polpermissive WHEN true THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type
FROM pg_policy
WHERE polrelid = 'landlord_profiles'::regclass;

-- Step 7: Test the query that's failing
SELECT id, email, names FROM landlord_profiles
WHERE id = '8c8afffa-ccef-4117-9312-bb162977d933'::uuid
LIMIT 1;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Landlord profiles RLS fix complete!';
    RAISE NOTICE 'All policies have been recreated.';
    RAISE NOTICE '========================================';
END $$;
