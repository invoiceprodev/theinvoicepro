-- Diagnostic only. Do not update profile data until each auth0_user_id has
-- been compared with the User ID shown for the same email in Auth0.
SELECT business_email, full_name, company_name, role
FROM public.profiles
WHERE lower(btrim(business_email)) IN (
  'invoiceprodev@gmail.com',
  'moreegasza@gmail.com',
  'threejmedia@gmail.com'
)
ORDER BY lower(btrim(business_email));

-- Compare this query's auth0_user_id values with the corresponding Auth0
-- User IDs before preparing any repair keyed by identity.
SELECT id, auth0_user_id, auth_provider, business_email, full_name, company_name, role
FROM public.profiles
WHERE lower(btrim(business_email)) IN (
  'invoiceprodev@gmail.com',
  'moreegasza@gmail.com',
  'threejmedia@gmail.com'
)
ORDER BY lower(btrim(business_email));