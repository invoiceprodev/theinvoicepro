# The InvoicePro

Customer invoicing SaaS with:
- public marketing site
- customer dashboard
- admin dashboard
- local API for Auth0-backed profile, subscription, email, Paystack, and PayFast integration work

## Current Architecture

- Customer app: `http://127.0.0.1:5173`
- Admin app: `http://127.0.0.1:5173/admin`
- Local API: `http://127.0.0.1:3000`
- Database and storage: `Supabase`
- Auth: `Auth0`
- Billing: `Paystack` primary, `PayFast` legacy/fallback
- Email: `Resend`

Production target:
- customer frontend on `Vercel`
- admin frontend on `Vercel`
- API on `Railway`

Current live deployment:
- customer frontend: `https://theinvoicepro.co.za`
- admin frontend: `https://admin.theinvoicepro.co.za`
- API: `https://api.theinvoicepro.co.za`

Deployment guide:
- [`DEPLOYMENT.md`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/DEPLOYMENT.md)

## Resume Note

Last checkpoint:
- Paystack checkout is the live recurring billing path currently working through the app
- PayPal subscription checkout option was added in code and pushed in commit `245db53`
- public frontend payment-method copy now advertises `Paystack` and `PayPal`
- customer frontend needed a redeploy previously to pick up billing-flow fixes

Where we stopped:
- PayPal is not fully tested yet
- local `.env` PayPal values were still blank at pause time
- the new SQL migration for PayPal token storage has not been run yet

Required before resuming PayPal testing:
- run [`db/migrations/PAYPAL_SUBSCRIPTION_TOKEN.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/PAYPAL_SUBSCRIPTION_TOKEN.sql)
- set `VITE_PAYPAL_CLIENT_ID` locally and in the customer Vercel project
- set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MODE`, and `PAYPAL_CALLBACK_URL` in the API environment
- restart local API/frontend after env updates

Local note:
- local frontend came up on `http://127.0.0.1:5174` during the last session because `5173` was already in use
- local API was started with `npm run api:start`

## What Works Now

- Auth0 customer signup, email verification, login
- Auth0 admin login and registration flow
- host-aware admin routing on the admin subdomain
- Auth0 user to Supabase `profiles` mapping through the API
- admin access enforced from mapped `public.profiles.role`, not only Auth0 token claims
- customer dashboard CRUD for clients, invoices, expenses
- admin pricing, tenants, and subscriptions pages using live API-backed data
- invoice email send with PDF attachment through Resend
- expense receipt email with PDF attachment through Resend
- company branding in settings, persisted to profile and Supabase Storage
- plan-aware signup flow
- subscription state in dashboard plans page
- Railway production API health at `https://api.theinvoicepro.co.za/health`

## Known Caveats

- Paystack is the active subscription checkout path under test and should be the frontend default provider
- PayPal subscription checkout has been added in code but still needs env setup, SQL migration, and live/local verification
- PayFast recurring sandbox is still blocked by merchant/account setup outside the app
- PayFast live payments are currently blocked at the merchant-account level. Current PayFast error: `Merchant unable to receive payments due to invalid account details provided.`
- When PayFast work resumes, start by fixing the PayFast merchant account details and live account verification before debugging app code or webhook handling

## Stack

- React 19
- Vite 6
- Refine
- Tailwind CSS
- shadcn/ui
- Express
- Supabase
- Auth0
- Resend

## Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Use [`.env.example`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/.env.example) as the reference.

Important groups:
- Supabase frontend keys
- Supabase service role key
- customer and admin Auth0 app vars
- API URLs
- Resend vars
- Paystack vars
- PayFast vars

### 3. Run required Supabase migrations

At minimum, make sure your Supabase project includes the current dashboard and Auth0 schema work.

Important migrations:
- [`db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql)
- [`db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql)
- [`db/migrations/AUTH0_PROFILE_DECOUPLING.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_PROFILE_DECOUPLING.sql)
- [`db/migrations/PLAN_METADATA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/PLAN_METADATA_ALIGNMENT.sql)
- [`db/migrations/EXPENSE_RECIPIENT_DETAILS.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/EXPENSE_RECIPIENT_DETAILS.sql)
- [`db/migrations/PAYPAL_SUBSCRIPTION_TOKEN.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/PAYPAL_SUBSCRIPTION_TOKEN.sql)

For a fresh project, also review:
- [`db/supabase_full_setup.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/supabase_full_setup.sql)

### 4. Start the app

Recommended:

```bash
npm run dev:all
```

That starts:
- frontend on `http://127.0.0.1:5173`
- API on `http://127.0.0.1:3000`

Admin-only shortcut:

```bash
npm run dev:admin
```

That starts the same local stack and serves the admin app at:
- `http://127.0.0.1:5173/admin/login`
- `http://127.0.0.1:5173/admin/register`

Customer-only shortcut:

```bash
npm run dev:customer
```

That starts the same local stack and serves the customer app at:
- `http://127.0.0.1:5173`
- `http://127.0.0.1:5173/login`
- `http://127.0.0.1:5173/register`

Or run them separately:

```bash
npm run api:dev
npm run dev
```

## Scripts

- `npm run dev` runs the frontend
- `npm run dev:admin` runs the frontend + API stack for admin work
- `npm run dev:customer` runs the frontend + API stack for customer work
- `npm run api:dev` runs the API in watch mode
- `npm run api:start` runs the API once
- `npm test` runs the baseline unit tests with Node's built-in test runner
- `npm run preview` runs the frontend production preview locally
- `npm run dev:all` runs frontend + API together
- `npm run build` runs TypeScript and production build
- `npm run vercel:login` logs into Vercel CLI
- `npm run railway:login` logs into Railway CLI
- `npm run env:sync:vercel:customer` pushes production customer frontend envs from `.env`
- `npm run env:sync:vercel:admin` pushes production admin frontend envs from `.env`
- `npm run env:sync:railway` pushes production API envs from `.env`

## Email Previews

For local email template review, run the API in development and open:

- `http://127.0.0.1:3000/emails/previews`

That preview index exposes the React-rendered API email templates used for Resend delivery. Text versions are available with:

- `http://127.0.0.1:3000/emails/previews/<template>?format=text`

## Deployment Env Sync

Use the CLIs for environment consistency instead of editing deployment vars by hand.

Required one-time setup:

```bash
npm run vercel:login
npm run railway:login
```

Required shell vars before syncing:

```bash
export VERCEL_ORG_ID=...
export VERCEL_CUSTOMER_PROJECT_ID=...
export VERCEL_ADMIN_PROJECT_ID=...
export RAILWAY_SERVICE=...
# optional if you use a non-default Railway environment
export RAILWAY_ENVIRONMENT=production
```

Then sync:

```bash
npm run env:sync:vercel:customer
npm run env:sync:vercel:admin
npm run env:sync:railway
```

Notes:
- the sync script reads local `.env`
- customer/admin Vercel values are transformed to production URLs automatically
- Railway/API values use server-side plain env names, not `VITE_*`
- do not use the local debug flags in deployed environments

## Auth0 Setup

Use separate Auth0 applications for customer and admin.

Customer app URLs:
- callback: `http://127.0.0.1:5173/auth/callback`
- logout: `http://127.0.0.1:5173`

Admin app URLs:
- callback: `http://127.0.0.1:5173/admin/callback`
- logout: `http://127.0.0.1:5173/admin/login`

Admin production URLs:
- callback: `https://admin.theinvoicepro.co.za/callback`
- logout: `https://admin.theinvoicepro.co.za/login`
- login: `https://admin.theinvoicepro.co.za/login`

Notes:
- verification email is enforced for customer signup
- verification email is enforced for admin signup/login as well
- the text shown on Auth0-hosted login comes from your Auth0 app and tenant branding
- on the admin subdomain, routes resolve at `/login`, `/register`, `/callback`, and `/dashboard` without an extra `/admin` prefix
- if an admin user exists in Auth0 but cannot access the admin portal, verify `public.profiles.role = 'admin'`

## Production Reset

To wipe tenant/app data before going live, use:
- [`db/setup/PRODUCTION_CLEAN_START.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/setup/PRODUCTION_CLEAN_START.sql)

Important:
- this removes app data, `profiles`, and `auth.users`
- it does not clear the `company-branding` bucket from SQL; delete those objects manually in Supabase Storage
- after the wipe, create a fresh admin account and promote it with:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE business_email = 'your-admin-email@example.com';
```

## Trial Flow

Expected flow:
1. choose `Starter/Trial`
2. create account
3. confirm email
4. log in
5. trial starts without card for `Starter/Trial`
6. add billing later if needed before renewal

Card-required plans:
1. choose `Pro` or `Enterprise`
2. create account
3. confirm email
4. log in
5. continue to billing setup
6. complete Paystack now, or test PayPal after env + SQL setup is finished

## Branding

Customer settings can now save:
- company name
- business email
- business phone
- business address
- registration number
- logo upload

Logo storage uses Supabase Storage via the API and defaults to bucket:

```env
SUPABASE_BRANDING_BUCKET=company-branding
```

## Documents

- invoice and quote numbers now use padded sequences like `INV-0001` and `QUO-0001`
- invoice/quote PDFs use minimal saved company branding
- expense receipts can be downloaded and emailed with payment method shown as recorded metadata only

## Repo Structure

```text
src/
  components/   shared UI and app components
  contexts/     auth and shared client state
  hooks/        plan, subscription, email, and app hooks
  lib/          API client, PDF generation, Auth0 bridge, utilities
  pages/        landing, auth, dashboard, admin
  providers/    Refine auth/data providers
  services/     invoice, expense, PayFast, email helpers

api/
  src/          Express API for Auth0, Supabase, subscriptions, PayFast, email

db/
  migrations/   incremental SQL migrations
  schema/       schema docs
  supabase/     schema docs and setup references
```

## Recommended Next Production Work

- run the PayPal SQL migration and finish PayPal local/live testing
- verify Paystack webhook handling on the live Railway API domain
- verify Pro and Enterprise paid-plan checkout end-to-end in production-like mode
- complete PayFast recurring billing against a recurring-capable merchant setup only if PayFast remains needed as a legacy fallback
