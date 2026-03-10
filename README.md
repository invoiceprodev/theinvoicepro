# The InvoicePro

Customer invoicing SaaS with:
- public marketing site
- customer dashboard
- admin dashboard
- local API for Auth0-backed profile, subscription, email, and PayFast integration work

## Current Architecture

- Customer app: `http://127.0.0.1:5173`
- Admin app: `http://127.0.0.1:5173/admin`
- Local API: `http://127.0.0.1:3000`
- Database and storage: `Supabase`
- Auth: `Auth0`
- Billing: `PayFast`
- Email: `Resend`

Production target:
- customer frontend on `Vercel`
- admin frontend on `Vercel`
- API on `Railway`

Deployment guide:
- [`DEPLOYMENT.md`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/DEPLOYMENT.md)

## What Works Now

- Auth0 customer signup, email verification, login
- Auth0 admin login and registration flow
- Auth0 user to Supabase `profiles` mapping through the API
- customer dashboard CRUD for clients, invoices, expenses
- invoice email send with PDF attachment through Resend
- expense receipt email with PDF attachment through Resend
- company branding in settings, persisted to profile and Supabase Storage
- plan-aware signup flow
- subscription state in dashboard plans page

## Known Caveats

- PayFast recurring sandbox is still blocked by merchant/account setup outside the app

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
- PayFast vars

### 3. Run required Supabase migrations

At minimum, make sure your Supabase project includes the current dashboard and Auth0 schema work.

Important migrations:
- [`db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql)
- [`db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql)
- [`db/migrations/AUTH0_PROFILE_DECOUPLING.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_PROFILE_DECOUPLING.sql)
- [`db/migrations/PLAN_METADATA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/PLAN_METADATA_ALIGNMENT.sql)
- [`db/migrations/EXPENSE_RECIPIENT_DETAILS.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/EXPENSE_RECIPIENT_DETAILS.sql)

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
- `npm run preview` runs the frontend production preview locally
- `npm run dev:all` runs frontend + API together
- `npm run build` runs TypeScript and production build
- `npm run vercel:login` logs into Vercel CLI
- `npm run railway:login` logs into Railway CLI
- `npm run env:sync:vercel:customer` pushes production customer frontend envs from `.env`
- `npm run env:sync:vercel:admin` pushes production admin frontend envs from `.env`
- `npm run env:sync:railway` pushes production API envs from `.env`

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

Notes:
- verification email is enforced for customer signup
- the text shown on Auth0-hosted login comes from your Auth0 app and tenant branding

## Trial Flow

Expected flow:
1. choose `Starter/Trial`
2. create account
3. confirm email
4. log in
5. complete card setup
6. continue into the app with the active trial subscription

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

- finish PayFast recurring billing against a real recurring-capable merchant setup
- move callback/webhook testing onto the deployed API domain
- complete PayFast production webhook validation on the deployed API domain
# theinvoicepro
