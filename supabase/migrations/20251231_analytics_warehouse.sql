-- Analytics Data Warehouse Migration
-- Phase 4: World-Class Reporting & Analytics

-- =====================================================
-- PROPERTY PERFORMANCE MATERIALIZED VIEW
-- Fast reporting on property metrics
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_property_performance AS
SELECT
  p.id AS property_id,
  p.landlord_id,
  p.managing_agency_id,
  p.rent_pcm,
  p.address->>'city' AS city,
  p.address->>'postcode' AS postcode,
  p.bedrooms,
  p.property_type,
  p.is_available,
  p.listing_date,

  -- Interest metrics
  COALESCE(i.total_interests, 0) AS total_interests,
  COALESCE(i.pending_interests, 0) AS pending_interests,

  -- Match metrics
  COALESCE(m.total_matches, 0) AS total_matches,
  COALESCE(m.active_tenancies, 0) AS active_tenancies,
  COALESCE(m.completed_tenancies, 0) AS completed_tenancies,

  -- Time metrics
  m.avg_days_to_first_match,
  m.avg_days_to_tenancy,

  -- Issue metrics
  COALESCE(iss.total_issues, 0) AS total_issues,
  COALESCE(iss.open_issues, 0) AS open_issues,
  COALESCE(iss.resolved_issues, 0) AS resolved_issues,
  COALESCE(iss.avg_resolution_hours, 0) AS avg_resolution_hours,

  -- Rating metrics
  r.average_rating,
  r.total_ratings,

  -- Calculated metrics
  CASE
    WHEN p.is_available THEN
      EXTRACT(DAY FROM NOW() - p.listing_date::timestamp)::integer
    ELSE 0
  END AS days_on_market

FROM properties p

LEFT JOIN (
  SELECT
    property_id,
    COUNT(*) AS total_interests,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_interests
  FROM interests
  GROUP BY property_id
) i ON p.id = i.property_id

LEFT JOIN (
  SELECT
    property_id,
    COUNT(*) AS total_matches,
    COUNT(*) FILTER (WHERE tenancy_status = 'active') AS active_tenancies,
    COUNT(*) FILTER (WHERE tenancy_status = 'ended') AS completed_tenancies,
    AVG(EXTRACT(EPOCH FROM (created_at - listing_date)) / 86400)::numeric(10,2) AS avg_days_to_first_match,
    AVG(EXTRACT(EPOCH FROM (tenancy_start_date - created_at)) / 86400)::numeric(10,2) AS avg_days_to_tenancy
  FROM matches
  GROUP BY property_id
) m ON p.id = m.property_id

LEFT JOIN (
  SELECT
    property_id,
    COUNT(*) AS total_issues,
    COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'closed')) AS open_issues,
    COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS resolved_issues,
    AVG(EXTRACT(EPOCH FROM (resolved_at - raised_at)) / 3600)::numeric(10,2) AS avg_resolution_hours
  FROM issues
  GROUP BY property_id
) iss ON p.id = iss.property_id

LEFT JOIN (
  SELECT
    property_id,
    AVG(overall_score)::numeric(3,2) AS average_rating,
    COUNT(*) AS total_ratings
  FROM ratings
  WHERE is_hidden = false
  GROUP BY property_id
) r ON p.id = r.property_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_property_performance_id
  ON mv_property_performance(property_id);

-- =====================================================
-- AGENCY PERFORMANCE MATERIALIZED VIEW
-- Dashboard metrics for estate agents and management agencies
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_agency_performance AS
SELECT
  a.id AS agency_id,
  a.agency_type,
  a.company_name,
  a.service_areas,

  -- Portfolio size
  COALESCE(links.total_properties, 0) AS total_properties,
  COALESCE(links.active_properties, 0) AS active_properties,
  COALESCE(links.total_landlords, 0) AS total_landlords,

  -- Match performance
  COALESCE(matches.total_matches, 0) AS total_matches,
  COALESCE(matches.matches_this_month, 0) AS matches_this_month,
  COALESCE(matches.match_conversion_rate, 0) AS match_conversion_rate,

  -- Tenancy metrics
  COALESCE(matches.active_tenancies, 0) AS active_tenancies,
  COALESCE(matches.vacancy_rate, 0) AS vacancy_rate,
  matches.avg_days_to_let,

  -- SLA metrics
  COALESCE(issues.total_issues, 0) AS total_issues,
  COALESCE(issues.resolved_issues, 0) AS resolved_issues,
  issues.sla_compliance_rate,
  issues.avg_response_hours,
  issues.avg_resolution_hours,
  COALESCE(issues.overdue_issues, 0) AS overdue_issues,

  -- Financial (aggregated)
  COALESCE(financial.total_rent_managed, 0) AS total_rent_managed,
  COALESCE(financial.avg_commission_rate, 0) AS avg_commission_rate,
  COALESCE(financial.total_commission_earned, 0) AS total_commission_earned,

  -- Rating
  ratings.average_rating,
  ratings.total_ratings,
  ratings.would_recommend_percentage,

  -- Comparison to last month
  COALESCE(comparison.matches_change, 0) AS matches_vs_last_month,
  COALESCE(comparison.issues_change, 0) AS issues_vs_last_month

FROM agency_profiles a

LEFT JOIN (
  SELECT
    agency_id,
    COUNT(DISTINCT property_id) AS total_properties,
    COUNT(DISTINCT property_id) FILTER (WHERE is_active = true) AS active_properties,
    COUNT(DISTINCT landlord_id) AS total_landlords
  FROM agency_property_links
  GROUP BY agency_id
) links ON a.id = links.agency_id

LEFT JOIN (
  SELECT
    p.managing_agency_id AS agency_id,
    COUNT(DISTINCT m.id) AS total_matches,
    COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '30 days') AS matches_this_month,
    COUNT(DISTINCT m.id) FILTER (WHERE m.tenancy_status = 'active') AS active_tenancies,
    AVG(EXTRACT(DAY FROM (m.tenancy_start_date - m.created_at)))::numeric(10,2) AS avg_days_to_let,
    CASE
      WHEN COUNT(DISTINCT p.id) > 0
      THEN (COUNT(DISTINCT p.id) FILTER (WHERE p.is_available = true)::float / COUNT(DISTINCT p.id) * 100)::numeric(5,2)
      ELSE 0
    END AS vacancy_rate,
    CASE
      WHEN COUNT(DISTINCT i.id) > 0
      THEN (COUNT(DISTINCT m.id)::float / COUNT(DISTINCT i.id) * 100)::numeric(5,2)
      ELSE 0
    END AS match_conversion_rate
  FROM properties p
  LEFT JOIN matches m ON p.id = m.property_id
  LEFT JOIN interests i ON p.id = i.property_id
  WHERE p.managing_agency_id IS NOT NULL
  GROUP BY p.managing_agency_id
) matches ON a.id = matches.agency_id

LEFT JOIN (
  SELECT
    i.agency_id,
    COUNT(*) AS total_issues,
    COUNT(*) FILTER (WHERE i.status IN ('resolved', 'closed')) AS resolved_issues,
    COUNT(*) FILTER (WHERE i.is_overdue = true) AS overdue_issues,
    CASE
      WHEN COUNT(*) > 0
      THEN (COUNT(*) FILTER (WHERE i.is_overdue = false)::float / COUNT(*) * 100)::numeric(5,2)
      ELSE 100
    END AS sla_compliance_rate,
    AVG(i.response_time_hours)::numeric(10,2) AS avg_response_hours,
    AVG(i.resolution_time_days * 24)::numeric(10,2) AS avg_resolution_hours
  FROM issues i
  WHERE i.agency_id IS NOT NULL
  GROUP BY i.agency_id
) issues ON a.id = issues.agency_id

LEFT JOIN (
  SELECT
    agency_id,
    SUM(rent_pcm) AS total_rent_managed,
    AVG(commission_rate)::numeric(5,2) AS avg_commission_rate,
    SUM(total_commission_earned)::numeric(12,2) AS total_commission_earned
  FROM agency_property_links
  WHERE is_active = true
  GROUP BY agency_id
) financial ON a.id = financial.agency_id

LEFT JOIN (
  SELECT
    r.to_user_id AS agency_id,
    AVG(r.overall_score)::numeric(3,2) AS average_rating,
    COUNT(*) AS total_ratings,
    (COUNT(*) FILTER (WHERE r.would_recommend = true)::float / NULLIF(COUNT(*), 0) * 100)::numeric(5,2) AS would_recommend_percentage
  FROM ratings r
  WHERE r.to_user_type IN ('estate_agent', 'management_agency')
    AND r.is_hidden = false
  GROUP BY r.to_user_id
) ratings ON a.id = ratings.agency_id

LEFT JOIN (
  SELECT
    agency_id,
    current_month.matches - last_month.matches AS matches_change,
    current_month.issues - last_month.issues AS issues_change
  FROM (
    SELECT
      agency_id,
      COUNT(*) AS matches
    FROM matches m
    JOIN properties p ON m.property_id = p.id
    WHERE m.created_at > NOW() - INTERVAL '30 days'
      AND p.managing_agency_id IS NOT NULL
    GROUP BY p.managing_agency_id
  ) current_month
  CROSS JOIN LATERAL (
    SELECT
      COUNT(*) AS matches
    FROM matches m
    JOIN properties p ON m.property_id = p.id
    WHERE m.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
      AND p.managing_agency_id = current_month.agency_id
  ) last_month
  CROSS JOIN LATERAL (
    SELECT COUNT(*) AS issues FROM issues
    WHERE agency_id = current_month.agency_id
      AND raised_at > NOW() - INTERVAL '30 days'
  ) current_issues
  CROSS JOIN LATERAL (
    SELECT COUNT(*) AS issues FROM issues
    WHERE agency_id = current_month.agency_id
      AND raised_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
  ) last_issues
  WHERE true
) comparison ON a.id = comparison.agency_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_agency_performance_id
  ON mv_agency_performance(agency_id);

-- =====================================================
-- LANDLORD PORTFOLIO MATERIALIZED VIEW
-- Portfolio overview for individual landlords
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_landlord_portfolio AS
SELECT
  l.id AS landlord_id,
  l.names AS landlord_name,
  l.prs_registration_status,
  l.is_fully_compliant,

  -- Property metrics
  COALESCE(props.total_properties, 0) AS total_properties,
  COALESCE(props.available_properties, 0) AS available_properties,
  COALESCE(props.let_properties, 0) AS let_properties,
  props.total_monthly_rent,
  props.average_rent,

  -- Match/tenant metrics
  COALESCE(matches.total_matches, 0) AS total_matches,
  COALESCE(matches.active_tenancies, 0) AS active_tenancies,
  COALESCE(matches.pending_applications, 0) AS pending_applications,

  -- Issue tracking
  COALESCE(issues.total_issues, 0) AS total_issues,
  COALESCE(issues.open_issues, 0) AS open_issues,

  -- Rating
  ratings.average_rating,
  ratings.total_ratings,

  -- Agency relationships
  agencies.management_agency_name,
  agencies.estate_agent_name,

  -- Occupancy rate
  CASE
    WHEN COALESCE(props.total_properties, 0) > 0
    THEN ((COALESCE(props.let_properties, 0)::float / props.total_properties) * 100)::numeric(5,2)
    ELSE 0
  END AS occupancy_rate

FROM landlord_profiles l

LEFT JOIN (
  SELECT
    landlord_id,
    COUNT(*) AS total_properties,
    COUNT(*) FILTER (WHERE is_available = true) AS available_properties,
    COUNT(*) FILTER (WHERE is_available = false) AS let_properties,
    SUM(rent_pcm) AS total_monthly_rent,
    AVG(rent_pcm)::numeric(10,2) AS average_rent
  FROM properties
  GROUP BY landlord_id
) props ON l.id = props.landlord_id

LEFT JOIN (
  SELECT
    landlord_id,
    COUNT(*) AS total_matches,
    COUNT(*) FILTER (WHERE tenancy_status = 'active') AS active_tenancies,
    COUNT(*) FILTER (WHERE application_status = 'pending') AS pending_applications
  FROM matches
  GROUP BY landlord_id
) matches ON l.id = matches.landlord_id

LEFT JOIN (
  SELECT
    landlord_id,
    COUNT(*) AS total_issues,
    COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'closed')) AS open_issues
  FROM issues
  GROUP BY landlord_id
) issues ON l.id = issues.landlord_id

LEFT JOIN (
  SELECT
    to_user_id AS landlord_id,
    AVG(overall_score)::numeric(3,2) AS average_rating,
    COUNT(*) AS total_ratings
  FROM ratings
  WHERE to_user_type = 'landlord' AND is_hidden = false
  GROUP BY to_user_id
) ratings ON l.id = ratings.landlord_id

LEFT JOIN (
  SELECT DISTINCT ON (landlord_id)
    apl.landlord_id,
    ma.company_name AS management_agency_name,
    ea.company_name AS estate_agent_name
  FROM agency_property_links apl
  LEFT JOIN agency_profiles ma ON apl.agency_id = ma.id AND apl.link_type = 'management_agency'
  LEFT JOIN agency_profiles ea ON apl.agency_id = ea.id AND apl.link_type = 'estate_agent'
  WHERE apl.is_active = true
  ORDER BY landlord_id, apl.created_at DESC
) agencies ON l.id = agencies.landlord_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_landlord_portfolio_id
  ON mv_landlord_portfolio(landlord_id);

-- =====================================================
-- REFRESH FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  -- Refresh concurrently to avoid locking
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_property_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agency_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_landlord_portfolio;

  -- Log refresh
  RAISE NOTICE 'Analytics views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SCHEDULED REFRESH (via pg_cron if available)
-- =====================================================

-- Uncomment if using pg_cron extension
-- SELECT cron.schedule('refresh-analytics-hourly', '0 * * * *', 'SELECT refresh_analytics_views()');

-- =====================================================
-- ANALYTICS HELPER FUNCTIONS
-- =====================================================

-- Get property performance for a date range
CREATE OR REPLACE FUNCTION get_property_performance(
  p_landlord_id TEXT DEFAULT NULL,
  p_agency_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date DATE DEFAULT NOW()
)
RETURNS TABLE (
  property_id TEXT,
  city TEXT,
  rent_pcm NUMERIC,
  total_interests INTEGER,
  total_matches INTEGER,
  avg_days_to_let NUMERIC,
  average_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.property_id::TEXT,
    pp.city::TEXT,
    pp.rent_pcm,
    pp.total_interests::INTEGER,
    pp.total_matches::INTEGER,
    pp.avg_days_to_tenancy,
    pp.average_rating
  FROM mv_property_performance pp
  WHERE (p_landlord_id IS NULL OR pp.landlord_id = p_landlord_id)
    AND (p_agency_id IS NULL OR pp.managing_agency_id = p_agency_id);
END;
$$ LANGUAGE plpgsql;

-- Get SLA compliance report
CREATE OR REPLACE FUNCTION get_sla_compliance_report(
  p_agency_id TEXT,
  p_start_date DATE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date DATE DEFAULT NOW()
)
RETURNS TABLE (
  priority TEXT,
  total_issues INTEGER,
  resolved_issues INTEGER,
  sla_target_hours INTEGER,
  avg_resolution_hours NUMERIC,
  compliance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.priority::TEXT,
    COUNT(*)::INTEGER AS total_issues,
    COUNT(*) FILTER (WHERE i.status IN ('resolved', 'closed'))::INTEGER AS resolved_issues,
    CASE
      WHEN i.priority = 'emergency' THEN 4
      WHEN i.priority = 'urgent' THEN 24
      WHEN i.priority = 'routine' THEN 72
      ELSE 336
    END AS sla_target_hours,
    AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.raised_at)) / 3600)::NUMERIC(10,2) AS avg_resolution_hours,
    (COUNT(*) FILTER (WHERE NOT i.is_overdue)::FLOAT / NULLIF(COUNT(*), 0) * 100)::NUMERIC(5,2) AS compliance_rate
  FROM issues i
  WHERE i.agency_id = p_agency_id
    AND i.raised_at BETWEEN p_start_date AND p_end_date
  GROUP BY i.priority;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON MATERIALIZED VIEW mv_property_performance IS 'Aggregated property metrics for reporting';
COMMENT ON MATERIALIZED VIEW mv_agency_performance IS 'Agency KPIs and performance dashboard data';
COMMENT ON MATERIALIZED VIEW mv_landlord_portfolio IS 'Landlord portfolio overview metrics';
COMMENT ON FUNCTION refresh_analytics_views IS 'Refreshes all analytics materialized views concurrently';
