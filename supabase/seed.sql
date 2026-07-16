-- Seed plan data for the dashboard experience.

insert into public.plans (name, description, price, currency, billing_cycle, features, is_active, is_popular, trial_days, requires_card, auto_renew)
values
  (
    'Starter',
    'For founders who need invoicing and client management essentials.',
    0,
    'ZAR',
    'monthly',
    '["Invoice generation", "Client management", "Email support"]'::jsonb,
    true,
    false,
    14,
    false,
    true
  ),
  (
    'Pro',
    'For growing teams that need advanced invoicing, expenses, and contracts.',
    199,
    'ZAR',
    'monthly',
    '["Unlimited invoices", "Expense tracking", "Contract templates", "Priority support"]'::jsonb,
    true,
    true,
    14,
    true,
    true
  ),
  (
    'Enterprise',
    'For larger businesses that need onboarding, team collaboration, and custom workflows.',
    499,
    'ZAR',
    'monthly',
    '["Team workspaces", "Advanced analytics", "Custom integrations", "Dedicated onboarding"]'::jsonb,
    true,
    false,
    30,
    true,
    true
  )
on conflict (name, billing_cycle) do nothing;
