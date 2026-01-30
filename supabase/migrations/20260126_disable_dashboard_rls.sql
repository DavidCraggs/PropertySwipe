-- Disable RLS on dashboard tables
-- Since the app uses custom authentication (not Supabase Auth),
-- RLS policies checking auth.uid() don't work.
-- Access control is handled at the application layer instead.

ALTER TABLE custom_dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE metric_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE metric_alerts DISABLE ROW LEVEL SECURITY;

-- Drop all the policies since RLS is disabled
DROP POLICY IF EXISTS "Users can view own dashboards" ON custom_dashboards;
DROP POLICY IF EXISTS "Users can view shared dashboards" ON custom_dashboards;
DROP POLICY IF EXISTS "Users can create dashboards" ON custom_dashboards;
DROP POLICY IF EXISTS "Users can update own dashboards" ON custom_dashboards;
DROP POLICY IF EXISTS "Users can delete own dashboards" ON custom_dashboards;

DROP POLICY IF EXISTS "Users can view widgets on accessible dashboards" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can insert widgets on own dashboards" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can update widgets on own dashboards" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can delete widgets on own dashboards" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can view widgets on own dashboards" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can view widgets on shared dashboards" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can manage widgets on own dashboards" ON dashboard_widgets;

DROP POLICY IF EXISTS "Users can view own permissions" ON dashboard_permissions;
DROP POLICY IF EXISTS "Users can view permissions they granted" ON dashboard_permissions;
DROP POLICY IF EXISTS "Dashboard owners can insert permissions" ON dashboard_permissions;
DROP POLICY IF EXISTS "Dashboard owners can update permissions" ON dashboard_permissions;
DROP POLICY IF EXISTS "Dashboard owners can delete permissions" ON dashboard_permissions;
DROP POLICY IF EXISTS "Dashboard owners can manage permissions" ON dashboard_permissions;
DROP POLICY IF EXISTS "Users can view permissions shared with them" ON dashboard_permissions;

DROP POLICY IF EXISTS "Users can manage own reports" ON saved_reports;
DROP POLICY IF EXISTS "Users can manage own goals" ON metric_goals;
DROP POLICY IF EXISTS "Users can manage own alerts" ON metric_alerts;

-- Drop the helper functions we created
DROP FUNCTION IF EXISTS get_user_dashboard_ids(UUID);
DROP FUNCTION IF EXISTS user_owns_dashboard(UUID, UUID);
DROP FUNCTION IF EXISTS user_has_dashboard_access(UUID, UUID);
