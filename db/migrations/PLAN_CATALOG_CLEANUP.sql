-- ============================================================
-- Plan Catalog Cleanup
-- ============================================================
-- Purpose:
-- Remove legacy plan rows after subscriptions have been remapped to the
-- approved plan catalog.
--
-- Intended sequence:
-- 1. PLAN_METADATA_ALIGNMENT.sql
-- 2. PLAN_CATALOG_UPSERT.sql
-- 3. PLAN_SUBSCRIPTION_REMAP.sql
-- 4. PLAN_CATALOG_CLEANUP.sql
--
-- Safe to re-run as long as remaining legacy plan rows are no longer
-- referenced by subscriptions.

BEGIN;

DELETE FROM plans
WHERE name NOT IN ('Starter/Trial', 'Pro', 'Enterprise');

COMMIT;
