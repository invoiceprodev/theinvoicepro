-- ============================================================
-- Plan Subscription Remap
-- ============================================================
-- Purpose:
-- Remap existing subscriptions that still point to legacy plan rows
-- onto the approved plan catalog before old plans are deleted.
--
-- Intended sequence:
-- 1. PLAN_METADATA_ALIGNMENT.sql
-- 2. PLAN_CATALOG_UPSERT.sql
-- 3. PLAN_SUBSCRIPTION_REMAP.sql
-- 4. Optionally rerun the delete section from PLAN_CATALOG_UPSERT.sql
--
-- Safe to re-run.

BEGIN;

DO $$
DECLARE
  starter_trial_id UUID;
  pro_id UUID;
  enterprise_id UUID;
BEGIN
  SELECT id INTO starter_trial_id
  FROM plans
  WHERE name = 'Starter/Trial'
  LIMIT 1;

  SELECT id INTO pro_id
  FROM plans
  WHERE name = 'Pro'
  LIMIT 1;

  SELECT id INTO enterprise_id
  FROM plans
  WHERE name = 'Enterprise'
  LIMIT 1;

  IF starter_trial_id IS NULL THEN
    RAISE EXCEPTION 'Starter/Trial plan not found. Run PLAN_CATALOG_UPSERT.sql first.';
  END IF;

  IF pro_id IS NULL THEN
    RAISE EXCEPTION 'Pro plan not found. Run PLAN_CATALOG_UPSERT.sql first.';
  END IF;

  IF enterprise_id IS NULL THEN
    RAISE EXCEPTION 'Enterprise plan not found. Run PLAN_CATALOG_UPSERT.sql first.';
  END IF;

  -- Move legacy starter/trial/basic subscriptions to Starter/Trial.
  UPDATE subscriptions
  SET
    plan_id = starter_trial_id,
    updated_at = NOW()
  WHERE plan_id IN (
    SELECT id
    FROM plans
    WHERE name IN ('Trial', 'Starter', 'Basic')
      AND id <> starter_trial_id
  );

  -- Move any alternate Pro rows onto the approved Pro row.
  UPDATE subscriptions
  SET
    plan_id = pro_id,
    updated_at = NOW()
  WHERE plan_id IN (
    SELECT id
    FROM plans
    WHERE lower(name) = 'pro'
      AND id <> pro_id
  );

  -- Move any alternate Enterprise rows onto the approved Enterprise row.
  UPDATE subscriptions
  SET
    plan_id = enterprise_id,
    updated_at = NOW()
  WHERE plan_id IN (
    SELECT id
    FROM plans
    WHERE lower(name) = 'enterprise'
      AND id <> enterprise_id
  );
END $$;

COMMIT;
