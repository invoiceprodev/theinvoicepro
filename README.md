# The InvoicePro

Customer invoicing SaaS with:

- public marketing site, pricing, signup, blog, and legal pages
- customer dashboard for invoices, quotes, clients, expenses, AI contract drafting, compliance, and business settings
- admin dashboard for pricing tiers, tenant management, subscription health, and plan catalog control
- local API for Auth0-backed profile, subscription, email, Paystack, PayPal, and legacy PayFast integration work

## Current Architecture

- Customer app: `http://127.0.0.1:5173`
- Admin app: `http://127.0.0.1:5173/admin`
- Local API: `http://127.0.0.1:3000`
- Database and storage: `Supabase`
- Auth: `Auth0`
- Billing: `Paystack` primary with `PayPal` checkout enabled when configured
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

Current billing direction:

- customer checkout defaults to `Paystack`
- `PayPal` is shown alongside Paystack when `VITE_PAYPAL_CLIENT_ID` is configured
- legacy `PayFast` code remains in the API for backward compatibility only

Local note:

- local frontend came up on `http://127.0.0.1:5174` during the last session because `5173` was already in use
- local API was started with `npm run api:start`

## What Works Now

- Auth0 customer signup, email verification, login, and password reset email flow
- Auth0 admin login, registration, and password reset email flow
- host-aware admin routing on the admin subdomain
- Auth0 user to Supabase `profiles` mapping through the API
- admin access enforced from mapped `public.profiles.role`, not only Auth0 token claims
- customer dashboard CRUD for clients, invoices, quotes, expenses
- AI contract upload, generation, saved draft listing, detail view, and PDF download in the customer dashboard
- expense compliance and VAT tracking dashboard for business expense management
- company branding, business profile, and logo upload in dashboard settings
- draft-only invoice and quote deletion enforced in both the dashboard UI and API
- customer sidebar upgrade link to the plans page
- plan-aware signup flow and subscription state shown in the dashboard plans page
- admin pricing, tenant, subscription, trial conversion, and plan management pages using live API-backed data
- invoice email send with PDF attachment through Resend
- expense receipt email with PDF attachment through Resend
- Railway production API health endpoint at `https://api.theinvoicepro.co.za/health`

## Known Caveats

- Paystack is the default frontend checkout provider
- PayPal checkout is available when its frontend and API env vars are set
- legacy PayFast support still exists server-side, but it is no longer the recommended customer checkout path

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
- AI Contracts server-side keys
- customer and admin Auth0 app vars
- API URLs
- Resend vars
- Paystack vars
- PayPal vars

### 3. Run required Supabase migrations

At minimum, make sure your Supabase project includes the current dashboard and Auth0 schema work.

Important migrations:

- [`db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql)
- [`db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql)
- [`db/migrations/AUTH0_PROFILE_DECOUPLING.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_PROFILE_DECOUPLING.sql)
- [`db/migrations/AI_CONTRACTS_MVP.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AI_CONTRACTS_MVP.sql)
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
- `http://127.0.0.1:5173/admin/forgot-password`

Customer-only shortcut:

```bash
npm run dev:customer
```

That starts the same local stack and serves the customer app at:

- `http://127.0.0.1:5173`
- `http://127.0.0.1:5173/login`
- `http://127.0.0.1:5173/register`
- `http://127.0.0.1:5173/forgot-password`

Or run them separately:

```bash
npm run api:dev
npm run dev
```

## AI Contracts

Customer dashboard routes:

- `/contracts`
- `/contracts/create`
- `/contracts/:id`

Current flow:

- users can upload a supporting `PDF` or `DOCX` document
- uploaded files are stored in the Supabase bucket from `SUPABASE_CONTRACTS_BUCKET`
- when `LLAMA_PARSE_API_KEY` or `LLAMA_CLOUD_API_KEY` is configured, the API parses the uploaded document and includes extracted markdown in the generation prompt
- when `OPENAI_API_KEY` is configured, the API generates contract HTML with the configured model
- generated contract HTML is sanitized server-side before it is stored, displayed, or rendered to PDF
- users can preview the saved HTML draft and download a generated PDF copy

Required env vars for the full AI flow:

- `OPENAI_API_KEY`
- `OPENAI_CONTRACT_MODEL` optional, defaults to `gpt-4.1-mini`
- `LLAMA_PARSE_API_KEY` or `LLAMA_CLOUD_API_KEY`
- `SUPABASE_CONTRACTS_BUCKET` optional, defaults to `contract-documents`

Fallback behavior:

- if `OPENAI_API_KEY` is missing, the contracts page shows a readiness warning and generation falls back to the built-in HTML template
- if `LLAMA_PARSE_API_KEY` is missing, uploaded files are still stored, but document parsing is skipped and the contracts page shows that readiness warning

Backend endpoints:

- `GET /contracts/status`
- `GET /contracts`
- `GET /contracts/:id`
- `GET /contracts/:id/pdf`
- `POST /contracts/upload`
- `POST /contracts/generate`

Detailed setup:

- [`db/docs/AI_CONTRACTS_SETUP.md`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/docs/AI_CONTRACTS_SETUP.md)

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
- password reset emails use Auth0 database connection change-password emails for both customer and admin apps
- the text shown on Auth0-hosted login comes from your Auth0 app and tenant branding
- on the admin subdomain, routes resolve at `/login`, `/register`, `/forgot-password`, `/callback`, and `/dashboard` without an extra `/admin` prefix
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
- only draft invoices and quotes can be deleted; non-draft delete attempts are blocked by the API
- AI contract drafts are stored as sanitized HTML before dashboard rendering or PDF generation
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
