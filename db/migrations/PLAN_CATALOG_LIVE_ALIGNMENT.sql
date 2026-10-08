-- ============================================================
-- Live Plan Catalog Alignment
-- ============================================================
-- Align the live catalog with the four pricing tiers shown by the app.
-- Safe to re-run.
--
-- Existing subscriptions on legacy Trial/Starter/Basic, Pro, and
-- Enterprise rows are moved to the matching canonical plan. Other legacy
-- rows are deactivated, not deleted, so subscription history keeps its
-- plan references. The migration stops if any subscription still points
-- to a non-canonical plan.
--
-- Run this in the Supabase SQL Editor for an existing environment.

BEGIN;

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_card BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE plans
  DROP CONSTRAINT IF EXISTS plans_trial_days_check;

ALTER TABLE plans
  ADD CONSTRAINT plans_trial_days_check
  CHECK (trial_days >= 0);

CREATE TEMP TABLE desired_plans (
  name TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  features JSONB NOT NULL,
  is_popular BOOLEAN NOT NULL,
  trial_days INTEGER NOT NULL,
  requires_card BOOLEAN NOT NULL,
  auto_renew BOOLEAN NOT NULL,
  is_active BOOLEAN NOT NULL
) ON COMMIT DROP;

INSERT INTO desired_plans (
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
VALUES
  (
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
  ),
  (
    'Starter/Trial',
    'For freelancers and small businesses',
    150.00,
    'ZAR',
    'monthly',
    '[
      "150 Invoices / Quotes / Month",
      "50 Saved Clients",
      "5 Team Members",
      "Unlimited Saved Items",
      "Expenses & Compliance tracking",
      "PDF Export",
      "Custom Emails"
    ]'::jsonb,
    false,
    60,
    false,
    true,
    true
  ),
  (
    'Pro',
    'For growing businesses',
    320.00,
    'ZAR',
    'monthly',
    '[
      "250 Invoices / Quotes / Month",
      "100 Saved Clients",
      "5 Team Members",
      "Unlimited Saved Items",
      "Expenses & Compliance Tracking",
      "Recurring Statements",
      "PDF Export",
      "Remove Branding",
      "Custom Emails"
    ]'::jsonb,
    true,
    0,
    true,
    true,
    true
  ),
  (
    'Enterprise',
    'For large teams and organizations',
    480.00,
    'ZAR',
    'monthly',
    '[
      "Unlimited Invoices / Quotes / Month",
      "Unlimited Saved Clients",
      "10 Team Members",
      "Unlimited Saved Items",
      "Expenses & Compliance Tracking",
      "Recurring Statements",
      "PDF Export",
      "Remove Branding",
      "Custom Emails"
    ]'::jsonb,
    false,
    0,
    true,
    true,
    true
  );

UPDATE plans AS p
SET
  description = d.description,
  price = d.price,
  currency = d.currency,
  billing_cycle = d.billing_cycle,
  features = d.features,
  is_popular = d.is_popular,
  trial_days = d.trial_days,
  requires_card = d.requires_card,
  auto_renew = d.auto_renew,
  is_active = d.is_active,
  updated_at = NOW()
FROM desired_plans AS d
WHERE p.name = d.name;

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
SELECT
  d.name,
  d.description,
  d.price,
  d.currency,
  d.billing_cycle,
  d.features,
  d.is_popular,
  d.trial_days,
  d.requires_card,
  d.auto_renew,
  d.is_active
FROM desired_plans AS d
LEFT JOIN plans AS p
  ON p.name = d.name
WHERE p.id IS NULL;

UPDATE subscriptions AS s
SET
  plan_id = target.id,
  updated_at = NOW()
FROM plans AS old_plan
JOIN plans AS target
  ON target.name = CASE
    WHEN LOWER(old_plan.name) = 'free' THEN 'Free'
    WHEN LOWER(old_plan.name) IN ('trial', 'starter', 'basic', 'starter/trial')
      THEN 'Starter/Trial'
    WHEN LOWER(old_plan.name) = 'pro' THEN 'Pro'
    WHEN LOWER(old_plan.name) = 'enterprise' THEN 'Enterprise'
  END
WHERE s.plan_id = old_plan.id
  AND old_plan.id <> target.id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM subscriptions AS s
    JOIN plans AS p ON p.id = s.plan_id
    WHERE p.name NOT IN ('Free', 'Starter/Trial', 'Pro', 'Enterprise')
  ) THEN
    RAISE EXCEPTION
      'Plan catalog alignment stopped: subscriptions still reference non-canonical plans. Review those subscriptions before rerunning.';
  END IF;
END $$;

-- Keep legacy rows for subscription-history foreign keys, but hide them
-- from the public catalog.
UPDATE plans
SET
  is_active = name IN ('Free', 'Starter/Trial', 'Pro', 'Enterprise'),
  updated_at = NOW()
WHERE is_active IS DISTINCT FROM (name IN ('Free', 'Starter/Trial', 'Pro', 'Enterprise'));

COMMIT;

-- Verify that exactly the approved active catalog is public.
SELECT name, price, currency, billing_cycle, is_active
FROM plans
WHERE is_active = true
ORDER BY price, created_at;
