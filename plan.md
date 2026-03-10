# TheInvoicePro Migration Plan

## Objective

Migrate the current app to the target production architecture:

- Customer app: `https://theinvoicepro.co.za`
- Admin app: `https://admin.theinvoicepro.co.za`
- Backend API: `https://api.theinvoicepro.co.za`
- Frontend hosting: `Vercel`
- Backend hosting: `Railway`
- Database and storage: `Supabase`
- Auth: `Auth0`
- Billing: `PayFast`
- Email: `Resend`

## Current State Summary

The target deployment architecture is now live.

- Customer frontend is live on `Vercel`
- Admin frontend is live on `Vercel`
- Railway API is live and healthy at `https://api.theinvoicepro.co.za/health`
- Auth is now Auth0-based for customer and admin flows
- Resend delivery is API-owned
- Admin pricing, tenants, and subscriptions are API-backed
- Customer and admin still share one frontend codebase, but deploy as separate hostnames with host-aware routing
- Next major production focus is `PayFast`

## Immediate Next Focus

- Validate end-to-end PayFast checkout and recurring setup against a recurring-capable merchant account
- Confirm live webhook handling on `https://api.theinvoicepro.co.za/payfast/webhook`
- Re-test card-required trial start and paid-plan change flows after PayFast hardening

## Traceability Rules

Each implementation phase should track:

- Goal
- Scope
- Affected systems
- Dependencies
- Acceptance criteria
- Risks and rollback notes

Suggested work item format:

```text
ID: ARC-01
Phase: 1
Area: Auth / API / Frontend / Database / Billing / Email / Infra
Goal:
Scope:
Dependencies:
Acceptance:
Rollback:
Status:
```

## Target System Boundaries

### Customer Frontend

- Public landing page
- Signup and login entry points
- Customer dashboard for invoices, clients, expenses, compliance, plans, settings
- Hosted on Vercel
- Uses Auth0 for session/authentication
- Uses Railway API for privileged operations

### Admin Frontend

- Separate admin login
- Admin dashboard and operational tools
- Hosted on Vercel
- Uses Auth0 with admin role enforcement
- Uses Railway API for admin operations

### Backend API

- Hosted on Railway
- Owns privileged business logic
- Owns PayFast webhook handling and verification
- Owns Resend email sending
- Owns server-side billing and subscription workflows
- Owns any cross-tenant or admin-only operations

### Database and Storage

- Supabase Postgres remains source of truth
- Supabase Storage remains file/object storage layer
- RLS must be compatible with Auth0 user mapping and API access strategy

## Phase Plan

### Phase 1: Architecture Audit

Status: `pending`

Goal:

- Produce a clear gap analysis between the current implementation and the target architecture

Scope:

- Inventory frontend-only logic that should move to API
- Inventory direct Supabase reads/writes
- Inventory current auth assumptions
- Inventory email and billing integrations
- Inventory deployment-specific assumptions

Affected systems:

- Customer app
- Admin app
- Supabase
- serverless-era legacy code paths

Deliverables:

- Current vs target architecture matrix
- List of blocking migrations
- Ownership map for frontend/API/database/auth concerns

Acceptance criteria:

- Every major integration point is classified as keep, move, replace, or remove

### Phase 2: Repository and Deployment Model

Status: `pending`

Goal:

- Define the implementation shape for customer frontend, admin frontend, and Railway API

Scope:

- Decide monorepo or structured single repo layout
- Define shared package boundaries
- Define environment variable sets for Vercel, Railway, and Supabase
- Define domain routing and callback URL ownership

Affected systems:

- Repo structure
- Vercel projects
- Railway service
- CI/CD

Deliverables:

- Final repo layout
- Deployment topology
- Environment variable matrix

Acceptance criteria:

- A new engineer can tell where customer, admin, and API code belong without ambiguity

### Phase 3: Auth Migration to Auth0

Status: `pending`

Goal:

- Replace Supabase Auth with Auth0 for both customer and admin applications

Scope:

- Customer login/signup/logout
- Admin login/logout
- Auth callbacks for both subdomains
- Session handling in frontend apps
- Route protection
- Admin role mapping
- User identity mapping into Supabase records

Affected systems:

- Frontend auth providers
- Protected routes
- User provisioning
- Supabase profile mapping

Dependencies:

- Phase 2 deployment/domain decisions

Deliverables:

- Auth0 tenant/app configuration checklist
- Updated frontend auth layer
- User provisioning strategy for `profiles`

Acceptance criteria:

- Customer and admin authentication work through Auth0
- Admin access is role-gated
- No app path depends on Supabase Auth session state

### Phase 4: Backend API Extraction

Status: `pending`

Goal:

- Introduce Railway API as the owner of privileged server-side logic

Scope:

- API bootstrap
- Auth0 token validation middleware
- Health endpoints
- API route structure
- Shared error handling and logging

Affected systems:

- Railway service
- Frontend data flow
- Operational integrations

Dependencies:

- Phase 2 repo/deployment model
- Phase 3 Auth0 approach

Deliverables:

- Running Railway API service
- Authenticated API skeleton
- Base configuration for environments

Acceptance criteria:

- API is deployable independently
- Customer and admin frontends can call authenticated API endpoints

### Phase 5: Frontend Data Access Realignment

Status: `pending`

Goal:

- Move unsafe or privileged mutations from direct client-side execution to the API

Scope:

- Identify safe direct Supabase reads vs API-only operations
- Replace direct writes where ownership, secrets, or cross-tenant logic is involved
- Define API contracts for customer and admin features

Affected systems:

- Customer dashboard
- Admin dashboard
- Supabase access layer
- Railway API

Deliverables:

- Data access policy by resource
- Updated frontend service layer
- API endpoint map

Acceptance criteria:

- Privileged logic is no longer executed from browser-only code
- Frontend responsibilities are clearly separated from backend responsibilities

### Phase 6: Billing and Subscription Hardening

Status: `pending`

Goal:

- Centralize and harden PayFast billing flows

Scope:

- Checkout/session creation
- Subscription lifecycle changes
- Recurring billing support
- Webhook verification and replay safety
- Payment and subscription audit logging
- Retry/failure handling

Affected systems:

- Railway API
- PayFast integration
- Supabase tables: `subscriptions`, `payments`, `subscription_history`, `webhook_logs`

Dependencies:

- Phase 4 API extraction

Deliverables:

- Server-owned PayFast integration
- Verified webhook flow
- Subscription state machine rules

Acceptance criteria:

- Billing events are processed on the backend only
- Subscription state is traceable from logs and database records

### Phase 7: Email Migration to Resend

Status: `pending`

Goal:

- Keep email delivery server-side through Resend

Scope:

- Invoice emails
- Trial emails
- Subscription/billing emails
- Shared email template approach
- Event-triggered sending from API

Affected systems:

- Railway API
- Email templates
- Frontend UI triggers

Dependencies:

- Phase 4 API extraction

Deliverables:

- Resend integration module
- Email template inventory
- Event-to-email mapping

Acceptance criteria:

- Emails are sent through Resend from the backend
- No production email sending depends on browser credentials

### Phase 8: Database and Storage Alignment

Status: `pending`

Goal:

- Finalize Supabase schema and RLS for the target architecture

Scope:

- Confirm schema required by customer and admin apps
- Confirm storage model
- Confirm Auth0 identity mapping to `profiles`
- Confirm API service-role usage strategy
- Finalize migration scripts and full setup script

Affected systems:

- Supabase Postgres
- Supabase Storage
- RLS policies
- Provisioning logic

Dependencies:

- Auth and API decisions from earlier phases

Deliverables:

- Final schema baseline
- RLS model definition
- Storage policy definition
- Migration history

Acceptance criteria:

- Fresh environment can be provisioned from canonical setup files
- Existing environments can be upgraded safely with migrations

### Phase 9: App Separation and Frontend Delivery

Status: `pending`

Goal:

- Cleanly separate customer and admin frontend delivery for Vercel deployment

Scope:

- Customer app deployment config
- Admin app deployment config
- Shared components and shared config boundaries
- Auth0 callback/logout URLs per domain
- Public vs admin-only route separation

Affected systems:

- Customer frontend
- Admin frontend
- Vercel configuration

Dependencies:

- Phases 2 through 5

Deliverables:

- Deployable Vercel projects
- Domain-aware environment configs
- Separate frontend release process

Acceptance criteria:

- Customer and admin apps can deploy independently
- Admin routes are no longer coupled to customer domain routing

### Phase 10: Rollout, Testing, and Cutover

Status: `pending`

Goal:

- Migrate safely to the target architecture with rollback control

Scope:

- Environment-by-environment rollout
- Migration ordering
- Smoke tests
- Auth tests
- Billing tests
- Email tests
- Observability and alerting

Affected systems:

- Vercel
- Railway
- Supabase
- Auth0
- PayFast
- Resend

Deliverables:

- Cutover checklist
- Rollback plan
- Post-deploy verification checklist

Acceptance criteria:

- Customer login, admin login, invoice flow, billing flow, and email flow all pass in production

## Workstream Matrix

### Auth

- Replace Supabase Auth usage
- Introduce Auth0 SDK/server validation
- Map Auth0 identities to `profiles`
- Implement admin role enforcement
- Assign the correct Auth0 `admin` role to the intended admin users
- Re-test `/admin/login` and `/admin/register` with normal role enforcement restored
- Re-test customer login/signup return paths with email verification and trial start flow behaving correctly

### API

- Create Railway service
- Move privileged mutations and webhooks
- Add API contracts for frontends

### Database

- Keep Supabase as data/store layer
- Finalize schema and RLS
- Support Auth0 subject-to-profile mapping
- Update matching `profiles.role` records in Supabase to `admin`

### Billing

- Centralize PayFast in backend
- Verify webhook signatures
- Persist billing audit trail
- Restore card-required trial start behavior and verify `/auth/card-setup` flow end-to-end

### Email

- Remove obsolete client-side email patterns
- Implement Resend templates and send pipeline

### Frontend

- Separate customer/admin delivery
- Remove assumptions tied to single-domain/single-app deployment

## Immediate Next Actions

1. Produce the phase-1 audit matrix from the current repo.
2. Decide repo/deployment structure for customer, admin, and API surfaces.
3. Define Auth0 identity and role model before changing frontend auth code.
4. Stand up the Railway API skeleton before migrating PayFast and Resend logic.

## Status Tracker

- Phase 1: `pending`
- Phase 2: `pending`
- Phase 3: `pending`
- Phase 4: `pending`
- Phase 5: `pending`
- Phase 6: `pending`
- Phase 7: `pending`
- Phase 8: `pending`
- Phase 9: `pending`
- Phase 10: `pending`
