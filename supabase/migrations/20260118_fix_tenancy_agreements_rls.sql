-- Migration: Fix Tenancy Agreements RLS for Custom Auth
-- Description: Updates RLS policies to work with custom authentication
--
-- Since this application uses custom authentication (not Supabase Auth),
-- auth.uid() returns null. We need to allow access and rely on
-- application-level security for authorization.

-- =====================================================
-- DROP EXISTING POLICIES - Document Upload Portal (Plan 1)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own agreements" ON tenancy_agreements;
DROP POLICY IF EXISTS "Landlords and agencies can create agreements" ON tenancy_agreements;
DROP POLICY IF EXISTS "Landlords and agencies can update their agreements" ON tenancy_agreements;

DROP POLICY IF EXISTS "Users can view signatories for their agreements" ON agreement_signatories;
DROP POLICY IF EXISTS "Signers can update their own signature" ON agreement_signatories;
DROP POLICY IF EXISTS "Agreement owners can insert signatories" ON agreement_signatories;

DROP POLICY IF EXISTS "Users can view audit log for their agreements" ON agreement_audit_log;
DROP POLICY IF EXISTS "Anyone can insert audit entries for their agreements" ON agreement_audit_log;

-- =====================================================
-- DROP EXISTING POLICIES - Agreement Creator (Plan 2)
-- =====================================================
DROP POLICY IF EXISTS "agreement_templates_select_active" ON agreement_templates;
DROP POLICY IF EXISTS "agreement_clauses_select_all" ON agreement_clauses;
DROP POLICY IF EXISTS "agreement_clauses_insert" ON agreement_clauses;
DROP POLICY IF EXISTS "generated_agreements_select_party" ON generated_agreements;
DROP POLICY IF EXISTS "generated_agreements_insert" ON generated_agreements;
DROP POLICY IF EXISTS "generated_agreements_update_creator" ON generated_agreements;

-- Also drop any previously created permissive policies
DROP POLICY IF EXISTS "Allow all operations on tenancy_agreements" ON tenancy_agreements;
DROP POLICY IF EXISTS "Allow all operations on agreement_signatories" ON agreement_signatories;
DROP POLICY IF EXISTS "Allow all operations on agreement_audit_log" ON agreement_audit_log;
DROP POLICY IF EXISTS "Allow all operations on agreement_templates" ON agreement_templates;
DROP POLICY IF EXISTS "Allow all operations on agreement_clauses" ON agreement_clauses;
DROP POLICY IF EXISTS "Allow all operations on generated_agreements" ON generated_agreements;

-- =====================================================
-- NEW PERMISSIVE POLICIES FOR CUSTOM AUTH
-- =====================================================
-- Security is enforced at the application level:
-- 1. agreementService.ts validates user is landlord/agency before operations
-- 2. Queries filter by user IDs passed from the authenticated app session

-- Tenancy Agreements (Plan 1 - Document Upload)
CREATE POLICY "Allow all operations on tenancy_agreements"
ON tenancy_agreements FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Agreement Signatories (Plan 1)
CREATE POLICY "Allow all operations on agreement_signatories"
ON agreement_signatories FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Agreement Audit Log (Plan 1)
CREATE POLICY "Allow all operations on agreement_audit_log"
ON agreement_audit_log FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Agreement Templates (Plan 2 - read-only for users)
CREATE POLICY "Allow all operations on agreement_templates"
ON agreement_templates FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Agreement Clauses (Plan 2 - clause library)
CREATE POLICY "Allow all operations on agreement_clauses"
ON agreement_clauses FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Generated Agreements (Plan 2 - agreement creator wizard)
CREATE POLICY "Allow all operations on generated_agreements"
ON generated_agreements FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
