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
- temporary trial bypass for local testing while PayFast is unresolved

## Known Caveats

- PayFast recurring sandbox is still blocked by merchant/account setup outside the app
- `TRIAL_BYPASS_ENABLED` is currently available for testing and should be turned off once PayFast is working

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

Important current local flags:

```env
TRIAL_BYPASS_ENABLED=true
VITE_TRIAL_BYPASS_ENABLED=true
```

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

Or run them separately:

```bash
npm run api:dev
npm run dev
```

## Scripts

- `npm run dev` runs the frontend
- `npm run api:dev` runs the API in watch mode
- `npm run api:start` runs the API once
- `npm run dev:all` runs frontend + API together
- `npm run build` runs TypeScript and production build

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

Current local test flow:
1. choose `Starter/Trial`
2. create account
3. confirm email
4. log in
5. land on card setup
6. either:
   - use `Activate Trial` while bypass is enabled
   - or continue into PayFast

The bypass exists only to unblock testing and deployment work while PayFast sandbox is unresolved.

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
- disable trial bypass in production
- complete PayFast production webhook validation on the deployed API domain
# theinvoicepro
