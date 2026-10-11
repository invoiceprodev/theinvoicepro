-- Auth0 subject IDs below were verified against their account emails.
-- This repairs account email, company name, and role without changing profile
-- IDs or full_name.
BEGIN;

DO $$
DECLARE
  account_record RECORD;
  matching_profiles INTEGER;
BEGIN
  FOR account_record IN
    SELECT *
    FROM (VALUES
      ('auth0|6ac89fa1c660632fc1bad998', 'invoiceprodev@gmail.com', 'The Invoice Pro', 'admin'),
      ('auth0|6ac7632fa01e129601ce3880', 'moreegasza@gmail.com', 'Moree Gas', 'user'),
      ('auth0|6ac78147110c3fa9e4282e54', 'threejmedia@gmail.com', 'Three J Media (PTY) LTD', 'user')
    ) AS accounts(auth0_user_id, business_email, company_name, role)
  LOOP
    SELECT count(*) INTO matching_profiles
    FROM public.profiles
    WHERE auth0_user_id = account_record.auth0_user_id
      AND auth_provider = 'auth0';

    IF matching_profiles <> 1 THEN
      RAISE EXCEPTION
        'Expected exactly one Auth0 profile for subject %, found %',
        account_record.auth0_user_id,
        matching_profiles;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE lower(btrim(business_email)) = account_record.business_email
        AND auth_provider = 'auth0'
        AND auth0_user_id IS DISTINCT FROM account_record.auth0_user_id
    ) THEN
      RAISE EXCEPTION
        'Email % is already linked to a different Auth0 subject',
        account_record.business_email;
    END IF;
  END LOOP;

  UPDATE public.profiles AS profile
  SET business_email = account_mapping.business_email,
      company_name = account_mapping.company_name,
      role = account_mapping.role
  FROM (VALUES
    ('auth0|6ac89fa1c660632fc1bad998', 'invoiceprodev@gmail.com', 'The Invoice Pro', 'admin'),
    ('auth0|6ac7632fa01e129601ce3880', 'moreegasza@gmail.com', 'Moree Gas', 'user'),
    ('auth0|6ac78147110c3fa9e4282e54', 'threejmedia@gmail.com', 'Three J Media (PTY) LTD', 'user')
  ) AS account_mapping(auth0_user_id, business_email, company_name, role)
  WHERE profile.auth0_user_id = account_mapping.auth0_user_id
    AND profile.auth_provider = 'auth0';
END
$$;

COMMIT;

SELECT id, auth0_user_id, business_email, full_name, company_name, role
FROM public.profiles
WHERE auth0_user_id IN (
  'auth0|6ac89fa1c660632fc1bad998',
  'auth0|6ac7632fa01e129601ce3880',
  'auth0|6ac78147110c3fa9e4282e54'
)
ORDER BY business_email;