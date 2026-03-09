-- ============================================================
-- Plan Metadata Alignment
-- ============================================================
-- Purpose:
-- Add shared plan metadata so admin-managed plans can drive
-- landing pricing and customer dashboard subscription flows.
--
-- Safe to re-run.

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

COMMENT ON COLUMN plans.description IS 'Short marketing description shown on landing and dashboard pricing cards';
COMMENT ON COLUMN plans.is_popular IS 'Whether this plan should be visually highlighted as most popular';
COMMENT ON COLUMN plans.trial_days IS 'Number of free trial days before recurring billing begins';
COMMENT ON COLUMN plans.requires_card IS 'Whether a payment card must be collected before activation';
COMMENT ON COLUMN plans.auto_renew IS 'Whether the plan auto-renews after any configured trial period';

COMMIT;
