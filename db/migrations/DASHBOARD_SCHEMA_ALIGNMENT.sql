-- ============================================================
-- Dashboard Schema Alignment
-- ============================================================
-- Purpose:
-- Align the Supabase schema with the current dashboard structure:
-- - expenses module
-- - richer invoice workflow/statuses
-- - dashboard/settings persistence
-- - client status support
--
-- Safe to re-run.
-- Run in Supabase SQL Editor.

BEGIN;

-- ============================================================
-- 1. Profiles: persist dashboard settings and business metadata
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS default_language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
  ADD COLUMN IF NOT EXISTS default_payment_terms INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS default_invoice_notes TEXT,
  ADD COLUMN IF NOT EXISTS default_invoice_terms TEXT;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_vat_rate_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_vat_rate_check
  CHECK (vat_rate >= 0 AND vat_rate <= 100);

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_default_payment_terms_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_default_payment_terms_check
  CHECK (default_payment_terms >= 0);

COMMENT ON COLUMN profiles.registration_number IS 'Company registration number shown in settings and invoices';
COMMENT ON COLUMN profiles.vat_enabled IS 'Whether VAT should be enabled by default for this tenant';
COMMENT ON COLUMN profiles.vat_rate IS 'Default VAT percentage used for invoices and compliance reporting';
COMMENT ON COLUMN profiles.vat_number IS 'VAT registration number shown on tax invoices';
COMMENT ON COLUMN profiles.default_language IS 'Default dashboard language';
COMMENT ON COLUMN profiles.invoice_prefix IS 'Default prefix for generated invoice numbers';
COMMENT ON COLUMN profiles.default_payment_terms IS 'Default payment terms in days';
COMMENT ON COLUMN profiles.default_invoice_notes IS 'Default notes prefilled on new invoices';
COMMENT ON COLUMN profiles.default_invoice_terms IS 'Default terms and conditions prefilled on new invoices';

CREATE INDEX IF NOT EXISTS idx_profiles_vat_enabled ON profiles(vat_enabled);

-- ============================================================
-- 2. Clients: support active/inactive/suspended state
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';

ALTER TABLE clients
  ALTER COLUMN user_id SET DEFAULT auth.uid();

UPDATE clients
SET status = 'Active'
WHERE status IS NULL OR status NOT IN ('Active', 'Inactive', 'Suspended');

ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_status_check;

ALTER TABLE clients
  ADD CONSTRAINT clients_status_check
  CHECK (status IN ('Active', 'Inactive', 'Suspended'));

COMMENT ON COLUMN clients.status IS 'Client status used in dashboard filtering and lifecycle management';

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_user_status ON clients(user_id, status);

-- ============================================================
-- 3. Invoices: support draft/sent workflow, currency, discounts
-- ============================================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE invoices
  ALTER COLUMN user_id SET DEFAULT auth.uid();

UPDATE invoices
SET status = LOWER(status)
WHERE status IS NOT NULL;

UPDATE invoices
SET status = 'pending'
WHERE status NOT IN ('draft', 'sent', 'paid', 'pending', 'overdue');

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'pending', 'overdue'));

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_discount_type_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_discount_type_check
  CHECK (discount_type IN ('percentage', 'fixed'));

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_discount_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_discount_check
  CHECK (discount >= 0);

COMMENT ON COLUMN invoices.currency IS 'Invoice currency used for display and calculations';
COMMENT ON COLUMN invoices.discount_type IS 'Discount mode applied to invoice total: percentage or fixed';
COMMENT ON COLUMN invoices.discount IS 'Discount value applied before tax/total finalisation';

CREATE INDEX IF NOT EXISTS idx_invoices_currency ON invoices(currency);
CREATE INDEX IF NOT EXISTS idx_invoices_user_due_date ON invoices(user_id, due_date DESC);

-- ============================================================
-- 4. Expenses: backing table for dashboard/expenses + compliance
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL
    CHECK (category IN ('Pay Client', 'Pay Salary', 'Subscription', 'Operating Cost', 'Other')),
  recipient TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'ZAR',
  payment_method TEXT
    CHECK (payment_method IN ('Bank Transfer', 'Cash', 'Card', 'EFT')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Paid', 'Cancelled')),
  notes TEXT,
  vat_applicable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE expenses IS 'Tenant-owned business expenses used for dashboard tracking and VAT compliance';
COMMENT ON COLUMN expenses.category IS 'Expense category used by dashboard summaries';
COMMENT ON COLUMN expenses.recipient IS 'Payee or recipient of the expense';
COMMENT ON COLUMN expenses.payment_method IS 'How the expense was paid';
COMMENT ON COLUMN expenses.vat_applicable IS 'Whether this expense should contribute to VAT input calculations';

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_status ON expenses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can insert any expense" ON expenses;
DROP POLICY IF EXISTS "Admins can update any expense" ON expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON expenses;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all expenses"
  ON expenses FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert any expense"
  ON expenses FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update any expense"
  ON expenses FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete expenses"
  ON expenses FOR DELETE
  USING (is_admin());

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. Invoice items consistency
-- ============================================================

ALTER TABLE invoice_items
  ALTER COLUMN quantity TYPE NUMERIC(10,2),
  ALTER COLUMN unit_price TYPE NUMERIC(10,2),
  ALTER COLUMN total TYPE NUMERIC(10,2);

-- ============================================================
-- 6. Verification helpers
-- ============================================================
-- Optional checks to run after execution:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name IN ('profiles', 'clients', 'invoices', 'expenses')
-- ORDER BY table_name, ordinal_position;
--
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'expenses'
-- ORDER BY policyname;

COMMIT;
