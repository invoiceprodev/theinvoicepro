-- ============================================================
-- Auth0 Profile Decoupling
-- ============================================================
-- Purpose:
-- Remove the hard dependency between profiles.id and auth.users(id)
-- so profiles can be created for Auth0 identities.
--
-- Safe to run once before backend-managed Auth0 profile sync.

BEGIN;

DO $$
DECLARE
  profile_auth_constraint RECORD;
BEGIN
  FOR profile_auth_constraint IN
    SELECT constraint_row.conname
    FROM pg_constraint AS constraint_row
    WHERE constraint_row.conrelid = 'public.profiles'::regclass
      AND constraint_row.confrelid = 'auth.users'::regclass
      AND constraint_row.contype = 'f'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.profiles DROP CONSTRAINT %I',
      profile_auth_constraint.conname
    );
  END LOOP;
END $$;

ALTER TABLE profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

COMMENT ON TABLE profiles IS 'User profiles use generated IDs and Auth0 identity mappings; profiles.id does not reference auth.users';

COMMIT;
