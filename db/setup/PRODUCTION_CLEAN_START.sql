-- ============================================================
-- Production Clean Start
-- ============================================================
-- Purpose:
-- - remove all tenant data and app accounts
-- - clear stored company-branding objects
-- - recreate the approved live plan catalog
--
-- Run this in Supabase SQL Editor only when you are ready to wipe
-- the environment for a fresh production launch.
--
-- WARNING:
-- - This deletes all profiles, clients, invoices, expenses,
--   subscriptions, payments, history, and auth users.
-- - After this runs, no admin account will exist.
-- - Create a fresh account and promote it to role = 'admin'
--   before expecting admin.theinvoicepro.co.za to work.

BEGIN;

-- Remove uploaded branding assets while keeping the bucket itself.
DELETE FROM storage.objects
WHERE bucket_id = 'company-branding';

-- Remove dependent application data first.
TRUNCATE TABLE
  public.team_members,
  public.webhook_logs,
  public.subscription_history,
  public.trial_conversions,
  public.payments,
  public.invoice_items,
  public.invoices,
  public.expenses,
  public.subscriptions,
  public.clients
RESTART IDENTITY CASCADE;

-- Remove profile rows before auth users.
DELETE FROM public.profiles;

-- Remove all auth accounts.
DELETE FROM auth.users;

-- Reset the plan catalog.
TRUNCATE TABLE public.plans RESTART IDENTITY CASCADE;

INSERT INTO public.plans (
  name,
  description,
  price,
  currency,
  billing_cycle,
  features,
  is_popular,
  trial_days,
  requires_card,
  auto_renew,
  is_active
)
VALUES
  (
    'Starter/Trial',
    'For freelancers and small businesses',
    150.00,
    'ZAR',
    'monthly',
    '[
      "150 Invoices / Quotes / Month",
      "50 Saved Clients",
      "5 Team Members",
      "Unlimited Saved Items",
      "Expenses & Compliance tracking",
      "Pdf export",
      "Custom Emails"
    ]'::jsonb,
    false,
    60,
    false,
    true,
    true
  ),
  (
    'Pro',
    'For growing businesses',
    320.00,
    'ZAR',
    'monthly',
    '[
      "250 Invoices / Quotes / Month",
      "100 Saved Clients",
      "5 Team Members",
      "Unlimited Saved Items",
      "Expenses & Compliance tracking",
      "Recurring Statements",
      "Pdf export",
      "Remove Branding",
      "Custom Emails"
    ]'::jsonb,
    true,
    0,
    true,
    true,
    true
  ),
  (
    'Enterprise',
    'For large teams and organizations',
    480.00,
    'ZAR',
    'monthly',
    '[
      "Unlimited Invoices / Quotes / Month",
      "Unlimited Saved Clients",
      "10 Team Members",
      "Unlimited Saved Items",
      "Expenses & Compliance tracking",
      "Recurring Statements",
      "Pdf export",
      "Remove Branding",
      "Custom Emails"
    ]'::jsonb,
    false,
    0,
    true,
    true,
    true
  );

COMMIT;

-- Post-run checks:
-- SELECT COUNT(*) FROM auth.users;
-- SELECT COUNT(*) FROM public.profiles;
-- SELECT COUNT(*) FROM public.subscriptions;
-- SELECT name, price, currency, is_active FROM public.plans ORDER BY price;

-- Promote your newly created admin account after signup:
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE business_email = 'you@example.com';
