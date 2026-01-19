-- Fix: Property Costs RLS Policy
-- Run this directly in Supabase SQL Editor
--
-- Issue: The current RLS policies use auth.uid() which returns NULL
-- because this app uses custom authentication, not Supabase Auth.
--
-- Solution: Allow all authenticated operations for now, or disable RLS.
-- In production, you would implement proper service-role authentication
-- or migrate to Supabase Auth.

-- Option 1: Drop existing policies and create permissive ones
DROP POLICY IF EXISTS "property_costs_select_policy" ON property_costs;
DROP POLICY IF EXISTS "property_costs_insert_policy" ON property_costs;
DROP POLICY IF EXISTS "property_costs_update_policy" ON property_costs;
DROP POLICY IF EXISTS "property_costs_delete_policy" ON property_costs;

-- Create new permissive policies (allow all operations)
-- NOTE: This is for development only. In production, implement proper auth.
CREATE POLICY "property_costs_select_policy" ON property_costs
    FOR SELECT USING (true);

CREATE POLICY "property_costs_insert_policy" ON property_costs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "property_costs_update_policy" ON property_costs
    FOR UPDATE USING (true);

CREATE POLICY "property_costs_delete_policy" ON property_costs
    FOR DELETE USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'property_costs';
