-- Initial Supabase schema for The Invoice Pro client dashboard
-- Applies to the public schema and uses auth.users as the tenant owner identity.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  business_email text,
  phone text,
  company_name text,
  address text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    business_name,
    business_email,
    company_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'business_email',
    new.raw_user_meta_data->>'company_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  currency text not null default 'ZAR',
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_popular boolean not null default false,
  trial_days integer not null default 0,
  requires_card boolean not null default false,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_name_billing_cycle_key unique (name, billing_cycle)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'trial' check (status in ('trial', 'active', 'cancelled', 'expired')),
  start_date date not null default current_date,
  end_date date,
  renewal_date date,
  payfast_token text,
  paystack_reference text,
  paystack_customer_code text,
  paystack_authorization_code text,
  subscription_token text,
  trial_start_date date,
  trial_end_date date,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text not null,
  company text,
  phone text,
  address text,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  invoice_number text not null,
  invoice_date date not null,
  due_date date not null,
  status text not null default 'pending' check (status in ('draft', 'sent', 'paid', 'pending', 'overdue')),
  currency text not null default 'ZAR',
  subtotal numeric(12,2) not null default 0,
  tax_percentage numeric(5,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  discount_type text not null default 'percentage' check (discount_type in ('percentage', 'fixed')),
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_user_number_key unique (user_id, invoice_number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  recipient text not null,
  recipient_email text,
  recipient_phone text,
  recipient_company text,
  amount numeric(12,2) not null default 0,
  currency text not null default 'ZAR',
  payment_method text not null default 'Bank Transfer',
  date date not null,
  status text not null default 'Pending' check (status in ('Pending', 'Paid', 'Cancelled')),
  notes text,
  vat_applicable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  old_plan_id uuid references public.plans(id) on delete set null,
  new_plan_id uuid references public.plans(id) on delete set null,
  old_status text,
  new_status text,
  action_type text not null default 'status_changed' check (action_type in ('created', 'plan_changed', 'status_changed', 'cancelled', 'upgraded', 'downgraded')),
  changed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trial_conversions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trial_start_date date not null,
  trial_end_date date not null,
  conversion_date date,
  status text not null default 'active_trial' check (status in ('active_trial', 'converted', 'cancelled', 'failed')),
  payment_id uuid,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  failure_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  currency text not null default 'ZAR',
  payment_method text not null default 'Card',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  payfast_payment_id text,
  transaction_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_user_id on public.clients(user_id);
create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_contracts_user_id on public.contracts(user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_plan_id on public.subscriptions(plan_id);
create index if not exists idx_subscription_history_subscription_id on public.subscription_history(subscription_id);
create index if not exists idx_subscription_history_user_id on public.subscription_history(user_id);
create index if not exists idx_trial_conversions_user_id on public.trial_conversions(user_id);
create index if not exists idx_payments_user_id on public.payments(user_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.handle_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.handle_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.handle_updated_at();

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.handle_updated_at();

create trigger invoice_items_set_updated_at
before update on public.invoice_items
for each row execute function public.handle_updated_at();

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.handle_updated_at();

create trigger contracts_set_updated_at
before update on public.contracts
for each row execute function public.handle_updated_at();

create trigger subscription_history_set_updated_at
before update on public.subscription_history
for each row execute function public.handle_updated_at();

create trigger trial_conversions_set_updated_at
before update on public.trial_conversions
for each row execute function public.handle_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.expenses enable row level security;
alter table public.contracts enable row level security;
alter table public.subscription_history enable row level security;
alter table public.trial_conversions enable row level security;
alter table public.payments enable row level security;

create policy if not exists "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy if not exists "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy if not exists "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists "plans_select_active" on public.plans
for select using (is_active = true);

create policy if not exists "plans_manage_admin" on public.plans
for all using (
  exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.is_admin = true
  )
);

create policy if not exists "subscriptions_manage_own" on public.subscriptions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "clients_manage_own" on public.clients
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "invoices_manage_own" on public.invoices
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "invoice_items_manage_own" on public.invoice_items
for all using (
  exists (
    select 1 from public.invoices as inv
    where inv.id = invoice_id and inv.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.invoices as inv
    where inv.id = invoice_id and inv.user_id = auth.uid()
  )
);

create policy if not exists "expenses_manage_own" on public.expenses
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "contracts_manage_own" on public.contracts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "subscription_history_manage_own" on public.subscription_history
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "trial_conversions_manage_own" on public.trial_conversions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "payments_manage_own" on public.payments
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
