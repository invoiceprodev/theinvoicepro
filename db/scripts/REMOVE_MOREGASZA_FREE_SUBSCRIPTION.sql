-- Cancel Moree Gas's incorrectly assigned Free subscription while preserving
-- its subscription history. This does not assign a replacement plan.
BEGIN;

DO $$
DECLARE
  target_profile_id UUID;
  profile_count INTEGER;
  free_subscription_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO profile_count
  FROM public.profiles
  WHERE auth0_user_id = 'auth0|6ac7632fa01e129601ce3880'
    AND auth_provider = 'auth0'
    AND lower(btrim(business_email)) = 'moreegasza@gmail.com';

  IF profile_count <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one linked Moree Gas profile, found %',
      profile_count;
  END IF;

  SELECT id
  INTO target_profile_id
  FROM public.profiles
  WHERE auth0_user_id = 'auth0|6ac7632fa01e129601ce3880'
    AND auth_provider = 'auth0'
    AND lower(btrim(business_email)) = 'moreegasza@gmail.com'
  FOR UPDATE;

  SELECT COUNT(*)
  INTO free_subscription_count
  FROM public.subscriptions AS subscription
  JOIN public.plans AS plan ON plan.id = subscription.plan_id
  WHERE subscription.user_id = target_profile_id
    AND subscription.status IN ('trial', 'active')
    AND lower(btrim(plan.name)) = 'free'
    AND plan.price = 0;

  IF free_subscription_count <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one current Free subscription for Moree Gas, found %',
      free_subscription_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions AS subscription
    JOIN public.plans AS plan ON plan.id = subscription.plan_id
    WHERE subscription.user_id = target_profile_id
      AND subscription.status IN ('trial', 'active')
      AND lower(btrim(plan.name)) = 'free'
      AND plan.price = 0
      AND (
        COALESCE(TO_JSONB(subscription) ->> 'payfast_token', '') <> ''
        OR COALESCE(TO_JSONB(subscription) ->> 'paystack_authorization_code', '') <> ''
        OR COALESCE(TO_JSONB(subscription) ->> 'subscription_token', '') <> ''
      )
  ) THEN
    RAISE EXCEPTION
      'The Free subscription unexpectedly has a recurring-payment authorization; investigate before cancellation.';
  END IF;

  UPDATE public.subscriptions AS subscription
  SET status = 'cancelled',
      end_date = CURRENT_DATE,
      renewal_date = NULL,
      trial_start_date = NULL,
      trial_end_date = NULL,
      auto_renew = false,
      updated_at = NOW()
  FROM public.plans AS plan
  WHERE subscription.plan_id = plan.id
    AND subscription.user_id = target_profile_id
    AND subscription.status IN ('trial', 'active')
    AND lower(btrim(plan.name)) = 'free'
    AND plan.price = 0;
END
$$;

COMMIT;

SELECT
  profile.business_email,
  subscription.status,
  plan.name AS plan_name,
  subscription.end_date
FROM public.profiles AS profile
JOIN public.subscriptions AS subscription ON subscription.user_id = profile.id
JOIN public.plans AS plan ON plan.id = subscription.plan_id
WHERE profile.auth0_user_id = 'auth0|6ac7632fa01e129601ce3880'
ORDER BY subscription.created_at DESC;