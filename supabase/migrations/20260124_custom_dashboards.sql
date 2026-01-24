-- Custom Dashboards & Reports Migration
-- Enables landlords and agencies to create custom data dashboards and scheduled reports

-- =====================================================
-- CUSTOM DASHBOARDS
-- =====================================================

-- User-created dashboard configurations
CREATE TABLE IF NOT EXISTS custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  layout JSONB NOT NULL DEFAULT '[]',
  template_id TEXT, -- Reference to predefined template if used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick user dashboard lookups
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_user_id ON custom_dashboards(user_id);

-- Individual widget configurations
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES custom_dashboards(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  position JSONB NOT NULL, -- {x, y, width, height}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for dashboard widget lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id ON dashboard_widgets(dashboard_id);

-- Dashboard sharing/permissions
CREATE TABLE IF NOT EXISTS dashboard_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES custom_dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(dashboard_id, user_id)
);

-- =====================================================
-- SAVED REPORTS
-- =====================================================

-- Saved report configurations (for scheduled/recurring reports)
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  config JSONB NOT NULL,
  schedule TEXT, -- cron expression or simple: 'daily', 'weekly', 'monthly'
  recipients TEXT[], -- email addresses
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user reports
CREATE INDEX IF NOT EXISTS idx_saved_reports_user_id ON saved_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_next_run ON saved_reports(next_run_at) WHERE is_active = true;

-- =====================================================
-- METRIC GOALS & ALERTS
-- =====================================================

-- User-defined KPI targets
CREATE TABLE IF NOT EXISTS metric_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  target_value DECIMAL(15,2) NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('above', 'below', 'exact')),
  deadline DATE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metric_goals_user_id ON metric_goals(user_id);

-- Metric alerts (threshold notifications)
CREATE TABLE IF NOT EXISTS metric_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('gt', 'lt', 'eq', 'gte', 'lte')),
  threshold DECIMAL(15,2) NOT NULL,
  notify_via TEXT[] DEFAULT ARRAY['in_app'],
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metric_alerts_user_id ON metric_alerts(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE custom_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_alerts ENABLE ROW LEVEL SECURITY;

-- Custom Dashboards: Users can manage their own dashboards
CREATE POLICY "Users can view own dashboards"
  ON custom_dashboards FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view shared dashboards"
  ON custom_dashboards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dashboard_permissions
      WHERE dashboard_id = custom_dashboards.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create dashboards"
  ON custom_dashboards FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own dashboards"
  ON custom_dashboards FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own dashboards"
  ON custom_dashboards FOR DELETE
  USING (user_id = auth.uid());

-- Dashboard Widgets: Access through dashboard ownership
CREATE POLICY "Users can view widgets on own dashboards"
  ON dashboard_widgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_dashboards
      WHERE id = dashboard_widgets.dashboard_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view widgets on shared dashboards"
  ON dashboard_widgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dashboard_permissions dp
      JOIN custom_dashboards cd ON cd.id = dp.dashboard_id
      WHERE cd.id = dashboard_widgets.dashboard_id
      AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage widgets on own dashboards"
  ON dashboard_widgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_dashboards
      WHERE id = dashboard_widgets.dashboard_id
      AND user_id = auth.uid()
    )
  );

-- Dashboard Permissions: Owners can manage, shared users can view
CREATE POLICY "Dashboard owners can manage permissions"
  ON dashboard_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_dashboards
      WHERE id = dashboard_permissions.dashboard_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view permissions shared with them"
  ON dashboard_permissions FOR SELECT
  USING (user_id = auth.uid());

-- Saved Reports: Users manage their own
CREATE POLICY "Users can manage own reports"
  ON saved_reports FOR ALL
  USING (user_id = auth.uid());

-- Metric Goals: Users manage their own
CREATE POLICY "Users can manage own goals"
  ON metric_goals FOR ALL
  USING (user_id = auth.uid());

-- Metric Alerts: Users manage their own
CREATE POLICY "Users can manage own alerts"
  ON metric_alerts FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_dashboards_updated_at
  BEFORE UPDATE ON custom_dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_reports_updated_at
  BEFORE UPDATE ON saved_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default dashboard per user
CREATE OR REPLACE FUNCTION enforce_single_default_dashboard()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE custom_dashboards
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER enforce_single_default_dashboard_trigger
  BEFORE INSERT OR UPDATE ON custom_dashboards
  FOR EACH ROW EXECUTE FUNCTION enforce_single_default_dashboard();
