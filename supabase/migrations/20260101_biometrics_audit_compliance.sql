-- Biometrics, Audit Logs, and Compliance for PropertySwipe
-- Phase 7 & 8: Mobile Excellence and Advanced Compliance

-- =====================================================
-- BIOMETRIC CREDENTIALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS biometric_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fingerprint', 'face', 'iris', 'security_key', 'unknown')),
  name TEXT NOT NULL DEFAULT 'My Device',
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_biometric_credentials_user ON biometric_credentials(user_id);
CREATE INDEX idx_biometric_credentials_credential ON biometric_credentials(credential_id);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT,
  user_email TEXT,
  user_type TEXT CHECK (user_type IN ('renter', 'landlord', 'agency', 'admin', 'system')),
  action TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'authentication', 'authorization', 'data_access', 'data_modification',
    'data_deletion', 'verification', 'payment', 'communication', 'system', 'compliance'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  resource_type TEXT,
  resource_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT
);

-- Indexes for common queries
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_success ON audit_logs(success);

-- Partitioning by month for performance (optional - requires PostgreSQL 10+)
-- In production, consider partitioning for large audit log tables

-- =====================================================
-- GDPR CONSENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS gdpr_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  version TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, purpose)
);

CREATE INDEX idx_gdpr_consents_user ON gdpr_consents(user_id);
CREATE INDEX idx_gdpr_consents_purpose ON gdpr_consents(purpose);

-- =====================================================
-- COMPLIANCE ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  area TEXT NOT NULL CHECK (area IN (
    'gdpr', 'right_to_rent', 'prs_registration', 'rra_2025',
    'tenant_protection', 'landlord_licensing', 'deposit_protection', 'energy_efficiency'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_required TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_alerts_user ON compliance_alerts(user_id);
CREATE INDEX idx_compliance_alerts_area ON compliance_alerts(area);
CREATE INDEX idx_compliance_alerts_severity ON compliance_alerts(severity);
CREATE INDEX idx_compliance_alerts_acknowledged ON compliance_alerts(acknowledged);

-- =====================================================
-- COMPLIANCE CHECKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  area TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('compliant', 'warning', 'non_compliant', 'pending', 'expired')),
  last_checked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_check TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, area, name)
);

CREATE INDEX idx_compliance_checks_user ON compliance_checks(user_id);
CREATE INDEX idx_compliance_checks_area ON compliance_checks(area);
CREATE INDEX idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX idx_compliance_checks_next ON compliance_checks(next_check);

-- =====================================================
-- DATA DELETION REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  scheduled_deletion_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  deleted_data_types TEXT[],
  retained_data_types TEXT[],
  retention_reasons JSONB,
  processed_by TEXT,
  audit_log_id UUID REFERENCES audit_logs(id)
);

CREATE INDEX idx_data_deletion_user ON data_deletion_requests(user_id);
CREATE INDEX idx_data_deletion_status ON data_deletion_requests(status);
CREATE INDEX idx_data_deletion_scheduled ON data_deletion_requests(scheduled_deletion_date);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Biometric Credentials: Users can only manage their own
ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials" ON biometric_credentials
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own credentials" ON biometric_credentials
  FOR ALL USING (user_id = auth.uid()::text);

-- Audit Logs: Only admins can view (or users viewing their own)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid()::text);

-- Note: Add admin policy separately based on your admin role implementation

-- GDPR Consents: Users can manage their own
ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON gdpr_consents
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own consents" ON gdpr_consents
  FOR ALL USING (user_id = auth.uid()::text);

-- Compliance Alerts: Users can view and acknowledge their own
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON compliance_alerts
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own alerts" ON compliance_alerts
  FOR UPDATE USING (user_id = auth.uid()::text);

-- Compliance Checks: Users can view their own
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checks" ON compliance_checks
  FOR SELECT USING (user_id = auth.uid()::text);

-- Data Deletion Requests: Users can view their own
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests" ON data_deletion_requests
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create deletion requests" ON data_deletion_requests
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- =====================================================
-- AUDIT LOG RETENTION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 2555)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL
  AND severity != 'critical';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE biometric_credentials IS 'WebAuthn biometric credentials for passwordless auth';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and security';
COMMENT ON TABLE gdpr_consents IS 'GDPR consent records for data processing';
COMMENT ON TABLE compliance_alerts IS 'Compliance warning and action alerts';
COMMENT ON TABLE compliance_checks IS 'Compliance check results and schedules';
COMMENT ON TABLE data_deletion_requests IS 'GDPR right to deletion requests';
