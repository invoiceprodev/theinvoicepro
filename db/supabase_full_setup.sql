-- ============================================================
-- TheInvoicePro — Full Supabase Database Setup Script
-- ============================================================
-- How to run:
--   1. Go to your Supabase project → SQL Editor
--   2. Paste this entire script into the editor
--   3. Click "Run" (or press Ctrl+Enter / Cmd+Enter)
--   4. This script is safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS)
--
-- Supabase Project: pfhbexbmarxelehrdcuz
-- Organisation:     dflsfsnzbhtcvucazyhl
--
-- Sections in this file:
--   1.  Extensions
--   2.  Helper Functions (needed before tables/triggers)
--   3.  Tables
--   4.  Foreign Key Constraints
--   5.  Indexes
--   6.  Row Level Security — Enable
--   7.  Row Level Security — Policies
--   8.  Triggers
--   9.  Seed Data
-- ============================================================


-- ======================== EXTENSIONS ========================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ===================== HELPER FUNCTIONS =====================

-- Returns true when the calling user has role = 'admin'
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Returns true when the calling user owns the given row
CREATE OR REPLACE FUNCTION is_owner(owner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic updated_at trigger function (reused by all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================== TABLES =========================
-- Creation order respects FK dependencies:
--   plans → profiles → clients → invoices → invoice_items
--   → subscriptions → payments → trial_conversions
--   → webhook_logs → subscription_history

-- ── plans ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT         NOT NULL UNIQUE,
  price          DECIMAL(10,2) NOT NULL,
  currency       TEXT         NOT NULL DEFAULT 'ZAR',
  billing_cycle  TEXT         NOT NULL DEFAULT 'monthly'
                              CHECK (billing_cycle IN ('monthly', 'yearly')),
  features       JSONB,
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE plans IS 'Pricing tier definitions for TheInvoicePro subscriptions';

-- ── profiles ───────────────────────────────────────────────
-- Extends auth.users. FK to auth.users added below via ALTER TABLE.
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID        PRIMARY KEY,
  full_name        TEXT,
  role             TEXT        NOT NULL DEFAULT 'user'
                               CHECK (role IN ('user', 'admin')),
  avatar_url       TEXT,
  -- Business settings (added by BUSINESS_SETTINGS_MIGRATION)
  company_name     TEXT,
  business_email   TEXT,
  business_phone   TEXT,
  business_address TEXT,
  currency         TEXT        DEFAULT 'ZAR',
  logo_url         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  profiles          IS 'User profile extending auth.users with business information';
COMMENT ON COLUMN profiles.company_name     IS 'Business/company name for invoicing';
COMMENT ON COLUMN profiles.business_email   IS 'Business contact email';
COMMENT ON COLUMN profiles.business_phone   IS 'Business contact phone';
COMMENT ON COLUMN profiles.business_address IS 'Business address for invoices';
COMMENT ON COLUMN profiles.currency         IS 'Default currency for invoices (ZAR, USD, EUR, GBP, etc.)';
COMMENT ON COLUMN profiles.logo_url         IS 'Business logo URL from Supabase Storage';

-- ── clients ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  company    TEXT,
  phone      TEXT,
  address    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, email)
);

COMMENT ON TABLE clients IS 'Customer/client records owned by a profile';

-- ── invoices ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT          NOT NULL UNIQUE,
  user_id         UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id       UUID          NOT NULL REFERENCES clients(id)  ON DELETE RESTRICT,
  invoice_date    DATE          NOT NULL,
  due_date        DATE          NOT NULL,
  status          TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('paid', 'pending', 'overdue')),
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_percentage  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  tax_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE invoices IS 'Invoice header records';

-- ── invoice_items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT          NOT NULL,
  quantity    DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
  total       DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE invoice_items IS 'Line items belonging to an invoice';

-- ── subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id          UUID        NOT NULL REFERENCES plans(id)    ON DELETE RESTRICT,
  status           TEXT        NOT NULL DEFAULT 'trial'
                               CHECK (status IN ('trial', 'active', 'cancelled', 'expired')),
  start_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  end_date         DATE,
  renewal_date     DATE,
  -- PayFast recurring billing token (added by SUBSCRIPTION_TOKEN_MIGRATION)
  payfast_token    TEXT,
  -- Trial period tracking (added by TRIAL_TRACKING_MIGRATION)
  trial_start_date TIMESTAMPTZ,
  trial_end_date   TIMESTAMPTZ,
  auto_renew       BOOLEAN     DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  subscriptions               IS 'User subscriptions to pricing plans';
COMMENT ON COLUMN subscriptions.payfast_token    IS 'PayFast subscription token for recurring payments';
COMMENT ON COLUMN subscriptions.trial_start_date IS 'Timestamp when the trial period started';
COMMENT ON COLUMN subscriptions.trial_end_date   IS 'Timestamp when the trial period ends (14 days from start)';
COMMENT ON COLUMN subscriptions.auto_renew       IS 'Whether subscription should auto-renew to paid plan after trial';

-- ── payments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID          NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  subscription_id       UUID          REFERENCES subscriptions(id)          ON DELETE SET NULL,
  invoice_id            UUID          REFERENCES invoices(id)               ON DELETE SET NULL,
  amount                NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency              TEXT          NOT NULL DEFAULT 'ZAR',
  payment_method        TEXT          NOT NULL DEFAULT 'payfast',
  status                TEXT          NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'completed', 'failed')),
  payfast_payment_id    TEXT,
  transaction_reference TEXT,
  created_at            TIMESTAMPTZ   DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE  payments                    IS 'Payment transactions for invoices and subscriptions via PayFast';
COMMENT ON COLUMN payments.payfast_payment_id    IS 'PayFast transaction ID from payment gateway';
COMMENT ON COLUMN payments.transaction_reference IS 'Additional transaction reference or merchant reference';

-- ── trial_conversions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS trial_conversions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  trial_start_date TIMESTAMPTZ NOT NULL,
  trial_end_date   TIMESTAMPTZ NOT NULL,
  conversion_date  TIMESTAMPTZ,
  status           TEXT        NOT NULL
                               CHECK (status IN ('active_trial', 'converted', 'cancelled', 'failed')),
  payment_id       UUID        REFERENCES payments(id),
  subscription_id  UUID        REFERENCES subscriptions(id),
  failure_reason   TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  trial_conversions              IS 'Tracks trial-to-paid conversion status and analytics for admin dashboard';
COMMENT ON COLUMN trial_conversions.status          IS 'Conversion status: active_trial, converted, cancelled, failed';
COMMENT ON COLUMN trial_conversions.failure_reason  IS 'Reason for failed conversion (e.g., payment declined, card expired)';
COMMENT ON COLUMN trial_conversions.trial_start_date IS 'When the trial period started';
COMMENT ON COLUMN trial_conversions.trial_end_date   IS 'When the trial period ends/ended';
COMMENT ON COLUMN trial_conversions.conversion_date  IS 'Date when trial was successfully converted to paid subscription';

-- ── webhook_logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_logs (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pf_payment_id      TEXT          UNIQUE,
  merchant_id        TEXT,
  merchant_key       TEXT,
  m_payment_id       TEXT,
  amount_gross       DECIMAL(10,2),
  amount_fee         DECIMAL(10,2),
  amount_net         DECIMAL(10,2),
  custom_str1        TEXT,      -- user_id
  custom_int1        INTEGER,   -- invoice_id or subscription_id (legacy int)
  payment_status     TEXT,      -- COMPLETE, FAILED, PENDING
  signature_verified BOOLEAN     DEFAULT false,
  raw_payload        JSONB,
  error_message      TEXT,
  processing_status  TEXT        DEFAULT 'pending'
                                 CHECK (processing_status IN ('pending', 'processed', 'failed')),
  invoice_id         UUID        REFERENCES invoices(id),
  subscription_id    UUID        REFERENCES subscriptions(id),
  payment_id         UUID        REFERENCES payments(id),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE webhook_logs IS 'Stores all PayFast webhook events for auditing and debugging';

-- ── subscription_history ───────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID        NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  old_plan_id     UUID        REFERENCES plans(id),
  new_plan_id     UUID        REFERENCES plans(id),
  old_status      TEXT,
  new_status      TEXT,
  action_type     TEXT        NOT NULL
                              CHECK (action_type IN (
                                'created','plan_changed','upgraded',
                                'downgraded','status_changed','cancelled'
                              )),
  changed_at      TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT
);

COMMENT ON TABLE subscription_history IS 'Audit trail of all subscription changes (plan upgrades, downgrades, status updates)';


-- ================== FOREIGN KEY CONSTRAINTS =================
-- profiles.id must reference auth.users(id)
-- Added separately because auth.users is a Supabase-managed table.

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS fk_profiles_user_id;

ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_user_id
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;


-- =========================== INDEXES ========================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role     ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_currency ON profiles(currency);

-- plans
CREATE INDEX IF NOT EXISTS idx_plans_name      ON plans(name);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email   ON clients(email);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id        ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id      ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status         ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date   ON invoices(invoice_date DESC);
-- composite
CREATE INDEX IF NOT EXISTS idx_invoices_user_status  ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_date  ON invoices(client_id, invoice_date DESC);

-- invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id      ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id      ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status       ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date ON subscriptions(renewal_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payfast_token
  ON subscriptions(payfast_token) WHERE payfast_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end_date
  ON subscriptions(trial_end_date) WHERE status = 'trial';
-- composite
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id        ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id      ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status          ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payfast_id      ON payments(payfast_payment_id);
-- composite
CREATE INDEX IF NOT EXISTS idx_payments_user_created ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_status  ON payments(user_id, status);

-- trial_conversions
CREATE INDEX IF NOT EXISTS idx_trial_conversions_user_id         ON trial_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_status          ON trial_conversions(status);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_trial_end_date  ON trial_conversions(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_conversion_date ON trial_conversions(conversion_date);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_payment_id      ON trial_conversions(payment_id);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_subscription_id ON trial_conversions(subscription_id);
-- composite
CREATE INDEX IF NOT EXISTS idx_trial_conversions_status_end
  ON trial_conversions(status, trial_end_date);

-- webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at       ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_pf_payment_id    ON webhook_logs(pf_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_invoice_id       ON webhook_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_subscription_id  ON webhook_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_status   ON webhook_logs(payment_status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processing_status ON webhook_logs(processing_status);

-- subscription_history
CREATE INDEX IF NOT EXISTS idx_sub_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_history_user_id         ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_history_changed_at      ON subscription_history(changed_at DESC);


-- ================ ROW LEVEL SECURITY — ENABLE ===============

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_conversions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;


-- ================ ROW LEVEL SECURITY — POLICIES =============

-- ── profiles ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"    ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"  ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"  ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin());

-- ── plans (public read, admin write) ───────────────────────
DROP POLICY IF EXISTS "Plans are publicly readable"  ON plans;
DROP POLICY IF EXISTS "Admins can insert plans"      ON plans;
DROP POLICY IF EXISTS "Admins can update plans"      ON plans;
DROP POLICY IF EXISTS "Admins can delete plans"      ON plans;

CREATE POLICY "Plans are publicly readable"
  ON plans FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert plans"
  ON plans FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update plans"
  ON plans FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete plans"
  ON plans FOR DELETE
  USING (is_admin());

-- ── clients ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own clients"   ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients"  ON clients;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  USING (is_admin());

-- ── invoices ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own invoices"   ON invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can view all invoices"  ON invoices;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  USING (is_admin());

-- ── invoice_items (ownership via parent invoice) ───────────
DROP POLICY IF EXISTS "Users can view own invoice items"   ON invoice_items;
DROP POLICY IF EXISTS "Users can insert own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can update own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Admins can view all invoice items"  ON invoice_items;

CREATE POLICY "Users can view own invoice items"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoice items"
  ON invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoice items"
  ON invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own invoice items"
  ON invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all invoice items"
  ON invoice_items FOR SELECT
  USING (is_admin());

-- ── subscriptions ──────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own subscriptions"   ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions"  ON subscriptions;
DROP POLICY IF EXISTS "Admins can insert any subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update any subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions"    ON subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert any subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update any subscription"
  ON subscriptions FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete subscriptions"
  ON subscriptions FOR DELETE
  USING (is_admin());

-- ── payments ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own payments"    ON payments;
DROP POLICY IF EXISTS "Users can insert own payments"  ON payments;
DROP POLICY IF EXISTS "Users can update own payments"  ON payments;
DROP POLICY IF EXISTS "Admins can view all payments"   ON payments;
DROP POLICY IF EXISTS "Admins can insert any payment"  ON payments;
DROP POLICY IF EXISTS "Admins can update any payment"  ON payments;
DROP POLICY IF EXISTS "Admins can delete payments"     ON payments;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert any payment"
  ON payments FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update any payment"
  ON payments FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete payments"
  ON payments FOR DELETE
  USING (is_admin());

-- ── trial_conversions ──────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own trial conversion"  ON trial_conversions;
DROP POLICY IF EXISTS "Admins can view all trial conversions"      ON trial_conversions;
DROP POLICY IF EXISTS "Admins can insert trial conversions"        ON trial_conversions;
DROP POLICY IF EXISTS "Admins can update trial conversions"        ON trial_conversions;

CREATE POLICY "Users can view their own trial conversion"
  ON trial_conversions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all trial conversions"
  ON trial_conversions FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert trial conversions"
  ON trial_conversions FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update trial conversions"
  ON trial_conversions FOR UPDATE
  USING (is_admin());

-- ── webhook_logs ───────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all webhook logs"     ON webhook_logs;
DROP POLICY IF EXISTS "Users can view their own webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "System can insert webhook logs"       ON webhook_logs;

CREATE POLICY "Admins can view all webhook logs"
  ON webhook_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can view their own webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    custom_str1 = auth.uid()::text
    OR invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
    OR subscription_id IN (SELECT id FROM subscriptions WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert webhook logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (true);

-- ── subscription_history ───────────────────────────────────
DROP POLICY IF EXISTS "Users can view own subscription history"   ON subscription_history;
DROP POLICY IF EXISTS "Admins can view all subscription history"  ON subscription_history;

CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscription history"
  ON subscription_history FOR SELECT
  USING (is_admin());


-- ====================== TRIGGERS ============================

-- Auto-update updated_at timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at       ON profiles;
DROP TRIGGER IF EXISTS update_plans_updated_at          ON plans;
DROP TRIGGER IF EXISTS update_clients_updated_at        ON clients;
DROP TRIGGER IF EXISTS update_invoices_updated_at       ON invoices;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at  ON subscriptions;
DROP TRIGGER IF EXISTS update_payments_updated_at       ON payments;
DROP TRIGGER IF EXISTS update_trial_conversions_updated_at ON trial_conversions;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_conversions_updated_at
  BEFORE UPDATE ON trial_conversions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Subscription history tracking trigger
CREATE OR REPLACE FUNCTION log_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscription_history
      (subscription_id, user_id, new_plan_id, new_status, action_type, notes)
    VALUES
      (NEW.id, NEW.user_id, NEW.plan_id, NEW.status, 'created', 'Subscription created');

  ELSIF TG_OP = 'UPDATE' THEN
    -- Plan change
    IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
      INSERT INTO subscription_history
        (subscription_id, user_id, old_plan_id, new_plan_id, old_status, new_status, action_type)
      VALUES (
        NEW.id, NEW.user_id, OLD.plan_id, NEW.plan_id, OLD.status, NEW.status,
        CASE
          WHEN (SELECT price FROM plans WHERE id = NEW.plan_id) >
               (SELECT price FROM plans WHERE id = OLD.plan_id) THEN 'upgraded'
          WHEN (SELECT price FROM plans WHERE id = NEW.plan_id) <
               (SELECT price FROM plans WHERE id = OLD.plan_id) THEN 'downgraded'
          ELSE 'plan_changed'
        END
      );
    END IF;

    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO subscription_history
        (subscription_id, user_id, old_plan_id, new_plan_id, old_status, new_status, action_type)
      VALUES (
        NEW.id, NEW.user_id, OLD.plan_id, NEW.plan_id, OLD.status, NEW.status,
        CASE WHEN NEW.status = 'cancelled' THEN 'cancelled' ELSE 'status_changed' END
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_subscription_changes ON subscriptions;

CREATE TRIGGER log_subscription_changes
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_subscription_changes();


-- ======================== SEED DATA =========================
-- Plans — Trial, Starter, Pro, Enterprise (all priced in ZAR)
-- Uses ON CONFLICT DO UPDATE so re-runs are safe.

INSERT INTO plans (name, price, currency, billing_cycle, features, is_active)
VALUES
  (
    'Trial',
    170.00,
    'ZAR',
    'monthly',
    '["Up to 5 invoices", "1 client", "PDF export", "14-day free trial", "Email support"]'::jsonb,
    true
  ),
  (
    'Starter',
    170.00,
    'ZAR',
    'monthly',
    '["Up to 20 invoices/month", "Up to 10 clients", "PDF export", "Email support", "Basic reporting"]'::jsonb,
    true
  ),
  (
    'Pro',
    899.00,
    'ZAR',
    'monthly',
    '["Unlimited invoices", "Unlimited clients", "PDF export", "Priority support", "Advanced reporting", "Custom branding", "Recurring invoices"]'::jsonb,
    true
  ),
  (
    'Enterprise',
    1799.00,
    'ZAR',
    'monthly',
    '["Everything in Pro", "Dedicated account manager", "API access", "Custom integrations", "SLA guarantee", "Team accounts", "Bulk operations"]'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  price         = EXCLUDED.price,
  currency      = EXCLUDED.currency,
  billing_cycle = EXCLUDED.billing_cycle,
  features      = EXCLUDED.features,
  is_active     = EXCLUDED.is_active,
  updated_at    = NOW();


-- ============================================================
-- ✅ Setup complete!
-- Verify with:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--   SELECT name, price, currency FROM plans ORDER BY price;
-- ============================================================
