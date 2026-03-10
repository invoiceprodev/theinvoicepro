-- ============================================================
-- Plan Catalog Upsert
-- ============================================================
-- Purpose:
-- Replace the existing plan catalog with the approved three-plan set:
-- - Starter/Trial
-- - Pro
-- - Enterprise
--
-- This script:
-- - updates matching plan names if they already exist
-- - inserts missing approved plans
-- - does NOT delete old plan rows; cleanup is handled separately
--
-- Run after:
-- - PLAN_METADATA_ALIGNMENT.sql
--
-- Warning:
-- - Old plan rows are intentionally left in place by this script.
-- - Run PLAN_SUBSCRIPTION_REMAP.sql and then PLAN_CATALOG_CLEANUP.sql
--   if you want to safely remove legacy rows.

BEGIN;

-- Ensure required metadata columns exist before upsert.
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
  description TEXT,
  price NUMERIC(10,2),
  currency TEXT,
  billing_cycle TEXT,
  features JSONB,
  is_popular BOOLEAN,
  trial_days INTEGER,
  requires_card BOOLEAN,
  auto_renew BOOLEAN,
  is_active BOOLEAN
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
      "Pdf export",
      "Custom Emails"
    ]'::jsonb,
    false,
    60,
    true,
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
      "Expenses & Compliance tracking",
      "Recurring Statements",
      "Pdf export",
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
      "Expenses & Compliance tracking",
      "Recurring Statements",
      "Pdf export",
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

COMMIT;
