-- Assign the promo-only Free plan to threejmedia@gmail.com.
-- Run in the Supabase SQL Editor after PUBLIC_FREE_PLAN.sql.
--
-- This is safe to re-run. It updates the account's single current
-- subscription or creates one if none exists. It stops if payment-provider
-- authorizations still exist; cancel recurring billing with the provider
-- before running this script.

BEGIN;

DO $$
DECLARE
  target_email CONSTANT TEXT := 'threejmedia@gmail.com';
  target_auth0_user_id CONSTANT TEXT := 'auth0|6ac78147110c3fa9e4282e54';
  profile_count INTEGER;
  current_subscription_count INTEGER;
  profile_id UUID;
  free_plan_id UUID;
  current_subscription_id UUID;
BEGIN
  SELECT COUNT(*)
  INTO profile_count
  FROM public.profiles
  WHERE auth0_user_id = target_auth0_user_id
    AND auth_provider = 'auth0'
    AND LOWER(BTRIM(business_email)) = target_email;

  IF profile_count <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one profile for %, found %.',
      target_email,
      profile_count;
  END IF;

  SELECT id
  INTO profile_id
  FROM public.profiles
  WHERE auth0_user_id = target_auth0_user_id
    AND auth_provider = 'auth0'
    AND LOWER(BTRIM(business_email)) = target_email
  FOR UPDATE;

  SELECT id
  INTO free_plan_id
  FROM public.plans
  WHERE name = 'Free'
    AND price = 0
    AND trial_days = 0
    AND requires_card = false
    AND auto_renew = false;

  IF free_plan_id IS NULL THEN
    RAISE EXCEPTION
      'Promo-only $0 Free plan not found. Run db/migrations/PUBLIC_FREE_PLAN.sql first.';
  END IF;

  SELECT COUNT(*)
  INTO current_subscription_count
  FROM public.subscriptions
  WHERE user_id = profile_id
    AND status IN ('trial', 'active');

  IF current_subscription_count > 1 THEN
    RAISE EXCEPTION
      'Found % current subscriptions for %. Resolve duplicates before assigning Free.',
      current_subscription_count,
      target_email;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions AS subscription
    WHERE subscription.user_id = profile_id
      AND subscription.status IN ('trial', 'active')
      AND (
        COALESCE(TO_JSONB(subscription) ->> 'payfast_token', '') <> ''
        OR COALESCE(TO_JSONB(subscription) ->> 'paystack_authorization_code', '') <> ''
        OR COALESCE(TO_JSONB(subscription) ->> 'subscription_token', '') <> ''
      )
  ) THEN
    RAISE EXCEPTION
      'A current subscription has a saved recurring-payment authorization. Cancel recurring billing with the provider and clear its authorization before assigning Free.';
  END IF;

  SELECT id
  INTO current_subscription_id
  FROM public.subscriptions
  WHERE user_id = profile_id
    AND status IN ('trial', 'active')
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF current_subscription_id IS NULL THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan_id,
      status,
      start_date,
      end_date,
      renewal_date,
      trial_start_date,
      trial_end_date,
      auto_renew
    )
    VALUES (
      profile_id,
      free_plan_id,
      'active',
      CURRENT_DATE,
      NULL,
      NULL,
      NULL,
      NULL,
      false
    );
  ELSE
    UPDATE public.subscriptions
    SET
      plan_id = free_plan_id,
      status = 'active',
      start_date = CASE
        WHEN plan_id IS DISTINCT FROM free_plan_id OR status <> 'active'
          THEN CURRENT_DATE
        ELSE start_date
      END,
      end_date = NULL,
      renewal_date = NULL,
      trial_start_date = NULL,
      trial_end_date = NULL,
      auto_renew = false,
      updated_at = NOW()
    WHERE id = current_subscription_id;
  END IF;
END $$;

COMMIT;

SELECT
  profile.business_email,
  subscription.id AS subscription_id,
  subscription.status,
  plan.name AS plan_name,
  plan.price,
  subscription.start_date,
  subscription.renewal_date,
  subscription.auto_renew
FROM public.profiles AS profile
JOIN public.subscriptions AS subscription
  ON subscription.user_id = profile.id
JOIN public.plans AS plan
  ON plan.id = subscription.plan_id
WHERE LOWER(BTRIM(profile.business_email)) = 'threejmedia@gmail.com'
  AND profile.auth0_user_id = 'auth0|6ac78147110c3fa9e4282e54'
  AND subscription.status IN ('trial', 'active')
ORDER BY subscription.created_at DESC;
