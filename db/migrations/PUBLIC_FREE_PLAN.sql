-- ============================================================
-- Public Free Plan
-- ============================================================
-- Add the public $0 plan with unlimited invoices, clients, and team
-- members. Safe to re-run in the Supabase SQL Editor.

BEGIN;

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_card BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT false;

INSERT INTO plans (
  name,
  description,
  price,
  currency,
  billing_cycle,
  features,
  is_popular,
  trial_days,
  requires_card,
  auto_renew,
  is_active
)
VALUES (
  'Free',
  'Essential invoicing with no subscription cost',
  0.00,
  'ZAR',
  'monthly',
  '[
    "Unlimited Invoices / Quotes / Month",
    "Unlimited Saved Clients",
    "Unlimited Team Members"
  ]'::jsonb,
  false,
  0,
  false,
  false,
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  billing_cycle = EXCLUDED.billing_cycle,
  features = EXCLUDED.features,
  is_popular = EXCLUDED.is_popular,
  trial_days = EXCLUDED.trial_days,
  requires_card = EXCLUDED.requires_card,
  auto_renew = EXCLUDED.auto_renew,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT name, price, currency, billing_cycle, is_active
FROM plans
WHERE name = 'Free';
