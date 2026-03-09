-- ============================================================
-- Auth0 Profile Decoupling
-- ============================================================
-- Purpose:
-- Remove the hard dependency between profiles.id and auth.users(id)
-- so profiles can be created for Auth0 identities.
--
-- Safe to run once before backend-managed Auth0 profile sync.

BEGIN;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS fk_profiles_user_id;

ALTER TABLE profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

COMMENT ON TABLE profiles IS 'User profile table decoupled from Supabase Auth for Auth0-backed identity';

COMMIT;
