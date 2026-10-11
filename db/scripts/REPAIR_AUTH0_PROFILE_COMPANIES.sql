BEGIN;

DO $$
DECLARE
  invoicepro_profiles INTEGER;
  moree_profiles INTEGER;
  threej_profiles INTEGER;
BEGIN
  SELECT count(*) INTO invoicepro_profiles
  FROM public.profiles
  WHERE lower(btrim(business_email)) = 'invoiceprodev@gmail.com'
    AND auth_provider = 'auth0'
    AND auth0_user_id IS NOT NULL;

  SELECT count(*) INTO moree_profiles
  FROM public.profiles
  WHERE lower(btrim(business_email)) = 'moreegasza@gmail.com'
    AND auth_provider = 'auth0'
    AND auth0_user_id IS NOT NULL;

  SELECT count(*) INTO threej_profiles
  FROM public.profiles
  WHERE lower(btrim(business_email)) = 'threejmedia@gmail.com'
    AND auth_provider = 'auth0'
    AND auth0_user_id IS NOT NULL;

  IF invoicepro_profiles <> 1 OR moree_profiles <> 1 OR threej_profiles <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one linked Auth0 profile for each account; found invoiceprodev=%, moreegasza=%, threejmedia=%',
      invoicepro_profiles,
      moree_profiles,
      threej_profiles;
  END IF;

  UPDATE public.profiles
  SET company_name = CASE lower(btrim(business_email))
      WHEN 'invoiceprodev@gmail.com' THEN 'The Invoice Pro'
      WHEN 'moreegasza@gmail.com' THEN 'Moree Gas'
      WHEN 'threejmedia@gmail.com' THEN 'Three J Media (PTY) LTD'
    END,
    role = CASE lower(btrim(business_email))
      WHEN 'invoiceprodev@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  WHERE lower(btrim(business_email)) IN (
      'invoiceprodev@gmail.com',
      'moreegasza@gmail.com',
      'threejmedia@gmail.com'
    )
    AND auth_provider = 'auth0'
    AND auth0_user_id IS NOT NULL;
END
$$;

COMMIT;

SELECT business_email, full_name, company_name, role
FROM public.profiles
WHERE lower(btrim(business_email)) IN (
  'invoiceprodev@gmail.com',
  'moreegasza@gmail.com',
  'threejmedia@gmail.com'
)
ORDER BY lower(btrim(business_email));