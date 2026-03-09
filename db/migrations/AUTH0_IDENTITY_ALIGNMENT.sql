-- ============================================================
-- Auth0 Identity Alignment
-- ============================================================
-- Purpose:
-- Prepare the schema for Auth0-backed identity while Supabase
-- remains the database and storage layer.
--
-- Safe to re-run.

BEGIN;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auth0_user_id TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'auth0',
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

UPDATE profiles
SET auth_provider = 'auth0'
WHERE auth_provider IS NULL OR auth_provider = '';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_auth_provider_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_auth_provider_check
  CHECK (auth_provider IN ('auth0', 'supabase'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_auth0_user_id
  ON profiles(auth0_user_id)
  WHERE auth0_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider ON profiles(auth_provider);

COMMENT ON COLUMN profiles.auth0_user_id IS 'Canonical Auth0 subject identifier, e.g. auth0|abc123';
COMMENT ON COLUMN profiles.auth_provider IS 'Identity provider backing this profile';
COMMENT ON COLUMN profiles.last_login_at IS 'Most recent successful login timestamp from API/Auth layer';

COMMIT;
