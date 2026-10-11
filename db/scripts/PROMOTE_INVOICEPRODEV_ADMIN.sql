BEGIN;

DO $$
DECLARE
  matching_profiles integer;
BEGIN
  SELECT count(*)
  INTO matching_profiles
  FROM public.profiles
  WHERE lower(btrim(business_email)) = 'invoiceprodev@gmail.com'
    AND auth_provider = 'auth0'
    AND auth0_user_id IS NOT NULL;

  IF matching_profiles <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one Auth0 profile for invoiceprodev@gmail.com; found %',
      matching_profiles;
  END IF;

  UPDATE public.profiles
  SET role = 'admin'
  WHERE lower(btrim(business_email)) = 'invoiceprodev@gmail.com'
    AND auth_provider = 'auth0'
    AND auth0_user_id IS NOT NULL;
END
$$;

COMMIT;
