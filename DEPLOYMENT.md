# Deployment Checklist

Target production surfaces:

- customer frontend: `https://theinvoicepro.co.za`
- admin frontend: `https://admin.theinvoicepro.co.za`
- API: `https://api.theinvoicepro.co.za`

Use [`.env.example`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/.env.example) as the canonical variable map.

CLI-first env sync:

- `npm run env:sync:vercel:customer`
- `npm run env:sync:vercel:admin`
- `npm run env:sync:railway`

Required before syncing:

```bash
npm run vercel:login
npm run railway:login

export VERCEL_ORG_ID=...
export VERCEL_CUSTOMER_PROJECT_ID=...
export VERCEL_ADMIN_PROJECT_ID=...
export RAILWAY_SERVICE=...
# optional if your Railway environment is not the default one
export RAILWAY_ENVIRONMENT=production
```

The sync script reads `.env`, selects the correct keys for each target, and applies production URL overrides automatically.

## 1. Prepare Values

Have these ready before creating anything:

- Supabase:
  - project URL
  - anon key
  - service role key
- Auth0 customer app:
  - domain
  - client ID
  - database connection name
- Auth0 admin app:
  - domain
  - client ID
  - database connection name
- Auth0 API:
  - audience: `https://api.theinvoicepro.co.za`
- Resend:
  - API key
  - verified sender domain
  - from address
- PayFast:
  - merchant ID
  - merchant key
  - passphrase
  - recurring/tokenization enabled
- Domains:
  - `theinvoicepro.co.za`
  - `admin.theinvoicepro.co.za`
  - `api.theinvoicepro.co.za`

## 2. Supabase

Run the required schema in Supabase SQL Editor.

Minimum migrations for existing projects:

- [`db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql)
- [`db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql)
- [`db/migrations/AUTH0_PROFILE_DECOUPLING.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_PROFILE_DECOUPLING.sql)
- [`db/migrations/PLAN_METADATA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/PLAN_METADATA_ALIGNMENT.sql)
- [`db/migrations/PLAN_CATALOG_UPSERT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/PLAN_CATALOG_UPSERT.sql)
- [`db/migrations/PLAN_SUBSCRIPTION_REMAP.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/PLAN_SUBSCRIPTION_REMAP.sql)
- [`db/migrations/PLAN_CATALOG_CLEANUP.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/PLAN_CATALOG_CLEANUP.sql)
- [`db/migrations/EXPENSE_RECIPIENT_DETAILS.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/EXPENSE_RECIPIENT_DETAILS.sql)

For a fresh project, use:

- [`db/supabase_full_setup.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/supabase_full_setup.sql)

Confirm:

- `company-branding` storage bucket is available
- plan rows exist for:
  - `Starter/Trial`
  - `Pro`
  - `Enterprise`

## 3. Auth0

Create and configure three Auth0 entities:

- customer application
- admin application
- API

Customer application allowed URLs:

- callback: `https://theinvoicepro.co.za/auth/callback`
- logout: `https://theinvoicepro.co.za`
- web origin: `https://theinvoicepro.co.za`

Admin application allowed URLs:

- callback: `https://admin.theinvoicepro.co.za/callback`
- logout: `https://admin.theinvoicepro.co.za/login`
- web origin: `https://admin.theinvoicepro.co.za`

API:

- identifier: `https://api.theinvoicepro.co.za`

Also confirm:

- customer and admin apps are enabled for the database connection
- email verification is enabled
- tenant branding and application names are production-ready

## 4. Railway API

Create one Railway service for the API.

Root/start expectations:

- start command: `npm run api:start`
- health check path: `/health`
- custom domain target port: `3000`
- do not require a checked-in `.env` file in production

Set these environment variables in Railway:

```env
API_BASE_URL=https://api.theinvoicepro.co.za
CUSTOMER_APP_URL=https://theinvoicepro.co.za
ADMIN_APP_URL=https://admin.theinvoicepro.co.za

AUTH0_DOMAIN=...
AUTH0_AUDIENCE=https://api.theinvoicepro.co.za

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BRANDING_BUCKET=company-branding

RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@theinvoicepro.co.za

PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
PAYFAST_PASSPHRASE=...
PAYFAST_MODE=live
PAYFAST_NOTIFY_URL=https://api.theinvoicepro.co.za/payfast/webhook
```

After deploy, confirm:

- `https://api.theinvoicepro.co.za/health` responds
- `https://api.theinvoicepro.co.za/payfast/webhook` is reachable

## 5. Vercel Customer Frontend

Create the customer Vercel project and attach:

- `theinvoicepro.co.za`

Build settings:

- framework: `Vite`
- build command: `npm run build`
- output directory: `dist`

Set these environment variables:

```env
VITE_APP_URL=https://theinvoicepro.co.za
VITE_API_URL=https://api.theinvoicepro.co.za

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=...

VITE_CUSTOMER_AUTH0_DOMAIN=...
VITE_CUSTOMER_AUTH0_CLIENT_ID=...
VITE_CUSTOMER_AUTH0_AUDIENCE=https://api.theinvoicepro.co.za
VITE_CUSTOMER_AUTH0_REDIRECT_URI=https://theinvoicepro.co.za/auth/callback
VITE_CUSTOMER_AUTH0_CONNECTION=Username-Password-Authentication

VITE_AUTH0_ROLE_CLAIM=https://theinvoicepro.co.za/roles
VITE_AUTH_MODE=auth0
```

## 6. Vercel Admin Frontend

Create the admin Vercel project and attach:

- `admin.theinvoicepro.co.za`

Build settings:

- framework: `Vite`
- build command: `npm run build`
- output directory: `dist`

Set these environment variables:

```env
VITE_APP_URL=https://admin.theinvoicepro.co.za
VITE_API_URL=https://api.theinvoicepro.co.za

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=...

VITE_ADMIN_AUTH0_DOMAIN=...
VITE_ADMIN_AUTH0_CLIENT_ID=...
VITE_ADMIN_AUTH0_AUDIENCE=https://api.theinvoicepro.co.za
VITE_ADMIN_AUTH0_REDIRECT_URI=https://admin.theinvoicepro.co.za/callback
VITE_ADMIN_AUTH0_CONNECTION=Username-Password-Authentication

VITE_AUTH0_ROLE_CLAIM=https://theinvoicepro.co.za/roles
VITE_AUTH_MODE=auth0
```

## 7. DNS

If DNS is managed where your nameservers point today, configure:

- apex/root `theinvoicepro.co.za` to Vercel
- `admin.theinvoicepro.co.za` to Vercel
- `api.theinvoicepro.co.za` to Railway target

Confirm SSL is issued for all three domains.

## 8. PayFast

Current blocker:

- PayFast currently returns: `Merchant unable to receive payments due to invalid account details provided.`
- This indicates a PayFast merchant-account configuration/verification issue, not an app redirect or DNS issue
- Resume PayFast work by fixing the merchant account in PayFast first, then re-test checkout and webhook handling

In PayFast dashboard, confirm:

- production merchant credentials are used
- passphrase matches deployed env
- tokenization / recurring billing is enabled
- notify URL is:
  - `https://api.theinvoicepro.co.za/payfast/webhook`

## 9. Production Checks

Verify in order:

1. customer site loads at `https://theinvoicepro.co.za`
2. admin site loads at `https://admin.theinvoicepro.co.za`
3. API health responds at `https://api.theinvoicepro.co.za/health`
4. customer Auth0 login/signup callback works
5. admin Auth0 login callback works
6. customer creates a client and invoice successfully
7. invoice email sends through Resend
8. logo upload works through Supabase Storage
9. plans page reflects live plans
10. admin subdomain routes resolve at `/login`, `/register`, `/callback`, `/dashboard`

## 10. Current Deployment Caveat

The frontend codebase is still one app with route-separated customer and admin surfaces. Customer and admin are deployed as two Vercel projects from the same repo, so keep the environment values distinct and validate host-aware routing after each deploy.
