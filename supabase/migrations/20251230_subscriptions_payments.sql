-- Subscription and Payment Tables for PropertySwipe
-- Phase 5: Payment & Subscription System with Stripe

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('landlord', 'agency')),

  -- Subscription details
  tier_id TEXT NOT NULL CHECK (tier_id IN ('free', 'basic', 'professional', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual')),

  -- Stripe references
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- Billing period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Usage tracking
  properties_used INTEGER DEFAULT 0,
  users_used INTEGER DEFAULT 1,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- CHECKOUT SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  billing_interval TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'canceled')),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_checkout_sessions_user ON checkout_sessions(user_id);
CREATE INDEX idx_checkout_sessions_status ON checkout_sessions(status);

-- =====================================================
-- PAYMENT METHODS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_payment_method_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
  last4 TEXT NOT NULL,
  brand TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);

-- =====================================================
-- INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_id TEXT REFERENCES subscriptions(id),
  stripe_invoice_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  invoice_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(created_at);

-- =====================================================
-- COMMISSION RATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id TEXT NOT NULL,
  landlord_id TEXT, -- Optional: specific landlord
  property_id TEXT, -- Optional: specific property
  type TEXT NOT NULL CHECK (type IN ('letting_fee', 'management_fee', 'renewal_fee', 'finding_fee')),
  percentage DECIMAL(5,2) NOT NULL,
  minimum_fee DECIMAL(10,2),
  maximum_fee DECIMAL(10,2),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(agency_id, landlord_id, property_id, type)
);

CREATE INDEX idx_commission_rates_agency ON commission_rates(agency_id);
CREATE INDEX idx_commission_rates_type ON commission_rates(type);
CREATE INDEX idx_commission_rates_active ON commission_rates(is_active);

-- =====================================================
-- COMMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id TEXT NOT NULL,
  landlord_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  match_id TEXT,

  type TEXT NOT NULL CHECK (type IN ('letting_fee', 'management_fee', 'renewal_fee', 'finding_fee')),
  description TEXT NOT NULL,

  -- Financial
  base_amount DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',

  -- Period (for recurring)
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'cancelled')),
  invoice_id TEXT,
  paid_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_agency ON commissions(agency_id);
CREATE INDEX idx_commissions_landlord ON commissions(landlord_id);
CREATE INDEX idx_commissions_property ON commissions(property_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_date ON commissions(created_at);
CREATE INDEX idx_commissions_type ON commissions(type);

-- =====================================================
-- USAGE TRACKING FUNCTIONS
-- =====================================================

-- Increment property usage
CREATE OR REPLACE FUNCTION increment_property_usage(p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE subscriptions
  SET properties_used = properties_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement property usage
CREATE OR REPLACE FUNCTION decrement_property_usage(p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE subscriptions
  SET properties_used = GREATEST(0, properties_used - 1),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Subscriptions: Users can only see their own
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid()::text);

-- Invoices: Users can only see their own
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (user_id = auth.uid()::text);

-- Payment methods: Users can only see their own
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (user_id = auth.uid()::text);

-- Commissions: Agencies can see their own commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view own commissions" ON commissions
  FOR SELECT USING (agency_id = auth.uid()::text);

-- Commission rates: Agencies can manage their rates
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view own rates" ON commission_rates
  FOR SELECT USING (agency_id = auth.uid()::text);

CREATE POLICY "Agencies can update own rates" ON commission_rates
  FOR ALL USING (agency_id = auth.uid()::text);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE subscriptions IS 'User subscription status and usage tracking';
COMMENT ON TABLE checkout_sessions IS 'Pending Stripe checkout sessions';
COMMENT ON TABLE payment_methods IS 'Stored payment methods (tokenized, no actual card data)';
COMMENT ON TABLE invoices IS 'Invoice history linked to Stripe invoices';
COMMENT ON TABLE commission_rates IS 'Agency commission rate configuration';
COMMENT ON TABLE commissions IS 'Tracked commissions earned by agencies';
