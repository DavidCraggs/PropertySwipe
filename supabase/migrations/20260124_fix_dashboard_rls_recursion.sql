-- Fix RLS infinite recursion in dashboard tables
-- The original policies had circular references between custom_dashboards and dashboard_permissions

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own dashboards" ON custom_dashboards;
DROP POLICY IF EXISTS "Users can view shared dashboards" ON custom_dashboards;
DROP POLICY IF EXISTS "Users can create dashboards" ON custom_dashboards;
DROP POLICY IF EXISTS "Users can update own dashboards" ON custom_dashboards;
DROP POLICY IF EXISTS "Users can delete own dashboards" ON custom_dashboards;

DROP POLICY IF EXISTS "Users can view widgets on own dashboards" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can view widgets on shared dashboards" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can manage widgets on own dashboards" ON dashboard_widgets;

DROP POLICY IF EXISTS "Dashboard owners can manage permissions" ON dashboard_permissions;
DROP POLICY IF EXISTS "Users can view permissions shared with them" ON dashboard_permissions;

-- =====================================================
-- RECREATE POLICIES WITHOUT CIRCULAR REFERENCES
-- =====================================================

-- Custom Dashboards: Simple ownership-based access
-- Using SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_dashboard_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM custom_dashboards WHERE user_id = uid
  UNION
  SELECT dashboard_id FROM dashboard_permissions WHERE user_id = uid;
$$;

-- Dashboard policies - no subqueries to other RLS-protected tables
CREATE POLICY "Users can view own dashboards"
  ON custom_dashboards FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create dashboards"
  ON custom_dashboards FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own dashboards"
  ON custom_dashboards FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own dashboards"
  ON custom_dashboards FOR DELETE
  USING (user_id = auth.uid());

-- Dashboard Permissions - simple policies
CREATE POLICY "Users can view own permissions"
  ON dashboard_permissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view permissions they granted"
  ON dashboard_permissions FOR SELECT
  USING (shared_by = auth.uid());

CREATE POLICY "Dashboard owners can insert permissions"
  ON dashboard_permissions FOR INSERT
  WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM custom_dashboards
      WHERE id = dashboard_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Dashboard owners can update permissions"
  ON dashboard_permissions FOR UPDATE
  USING (shared_by = auth.uid());

CREATE POLICY "Dashboard owners can delete permissions"
  ON dashboard_permissions FOR DELETE
  USING (shared_by = auth.uid());

-- Dashboard Widgets - check ownership via dashboard_id only
-- Use a SECURITY DEFINER function to check ownership without RLS recursion
CREATE OR REPLACE FUNCTION user_owns_dashboard(dashboard_uuid UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM custom_dashboards
    WHERE id = dashboard_uuid AND user_id = uid
  );
$$;

CREATE OR REPLACE FUNCTION user_has_dashboard_access(dashboard_uuid UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM custom_dashboards WHERE id = dashboard_uuid AND user_id = uid
  ) OR EXISTS (
    SELECT 1 FROM dashboard_permissions WHERE dashboard_id = dashboard_uuid AND user_id = uid
  );
$$;

CREATE POLICY "Users can view widgets on accessible dashboards"
  ON dashboard_widgets FOR SELECT
  USING (user_has_dashboard_access(dashboard_id, auth.uid()));

CREATE POLICY "Users can insert widgets on own dashboards"
  ON dashboard_widgets FOR INSERT
  WITH CHECK (user_owns_dashboard(dashboard_id, auth.uid()));

CREATE POLICY "Users can update widgets on own dashboards"
  ON dashboard_widgets FOR UPDATE
  USING (user_owns_dashboard(dashboard_id, auth.uid()));

CREATE POLICY "Users can delete widgets on own dashboards"
  ON dashboard_widgets FOR DELETE
  USING (user_owns_dashboard(dashboard_id, auth.uid()));
