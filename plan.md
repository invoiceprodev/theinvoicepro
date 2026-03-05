# Project: TheInvoicePro — SaaS Invoicing Platform

## Overview

A multi-tenant SaaS invoicing platform for small businesses. Customers access their own dashboard to manage invoices, clients, and expenses. Platform admins manage all tenants, plans, and metrics from a separate admin interface. The landing page at theinvoicepro.co.za drives signups.

### SaaS Structure

```
theinvoicepro.co.za         → Landing page (marketing + pricing + signup)
theinvoicepro.co.za/dashboard  → Customer Dashboard (invoices, clients, expenses)
theinvoicepro.co.za/admin      → Platform Admin (tenants, plans, metrics)
api.theinvoicepro.co.za        → Backend API (deferred — using Supabase directly)
```

---

## 🌐 Landing Page

<phase number="1" title="Core Landing Page Structure">

Deliver a functional landing page with hero section, 4-tier pricing display, and navigation elements.

#### Tasks

- [x] Create hero section with headline, subheadline, and Sign-up/Login CTAs
- [x] Build header navigation with logo area and CTA buttons
- [x] Display 4 pricing tier cards with plan names, prices, and feature lists
- [x] Create footer with basic navigation links

#### Notes

- Data source: Mock data (hardcoded content)
- Prices shown in ZAR by default

</phase>

<phase number="2" title="Currency Switcher & Enhanced Content">

Add currency switching, testimonials, and "Trusted By" logos.

#### Tasks

- [x] Add currency switcher toggle in pricing section
- [x] Create testimonials section with 3-4 customer quotes and avatars
- [x] Build "Trusted By" section with company logos
- [x] Implement currency conversion logic for pricing tiers
- [x] Add smooth scroll navigation from header to sections

</phase>

<phase number="3" title="Payment Methods & Polish">

Display supported payment methods, responsive design, and micro-interactions.

#### Tasks

- [x] Add payment method icons/badges in pricing section
- [x] Implement mobile hamburger menu for header navigation
- [x] Add hover effects and animations to pricing cards
- [x] Create highlighted "Popular" badge for Pro tier
- [x] Add smooth transitions and micro-interactions
- [x] Optimize CTA button placement and styling

</phase>

<phase number="4" title="Advanced Landing Page Features">

Add FAQ, feature comparison table, and SEO polish.

#### Tasks

- [ ] Create FAQ section with collapsible questions
- [ ] Build feature comparison table for all pricing tiers
- [ ] Add social proof metrics in hero or dedicated section
- [ ] Implement newsletter signup form in footer
- [ ] Add meta tags for SEO optimization

#### Notes

- FAQ uses shadcn-ui Accordion component
- Newsletter form is UI only (no backend yet)

</phase>

---

## 👤 Customer Dashboard (theinvoicepro.co.za/dashboard)

A per-tenant dashboard where business owners manage their invoices, clients, and expenses after logging in.

<phase number="5" title="Invoice List View">

Working invoice list page with table, status filters, and sidebar navigation.

#### Tasks

- [x] Set up invoice data types and mock data
- [x] Create invoice list page with data table
- [x] Add status badges and formatting for amounts
- [x] Implement sidebar navigation with Invoice section

#### Notes

- Invoice statuses: Paid (green), Pending (yellow), Overdue (red)
- Sidebar includes: Dashboard, Invoices, Clients, Expenses, Settings

</phase>

<phase number="6" title="Create & Edit Invoices">

Add functionality to create and edit invoices with client selection and line items.

#### Tasks

- [x] Build create invoice form with client dropdown
- [x] Add line items section with add/remove rows
- [x] Implement auto-calculation for totals
- [x] Add save and preview functionality
- [x] Create invoice detail view page
- [x] Build edit invoice form
- [x] Add status update actions (Mark as Paid, Mark as Sent)
- [x] Implement basic print preview

#### Notes

- Form: Client*, Invoice Date*, Due Date*, Line Items*, Tax %, Notes
- Invoice number auto-generated

</phase>

<phase number="7" title="Client Management">

Create and manage customer/client information linked to invoices.

#### Tasks

- [x] Create client list page with data table
- [x] Build create client form
- [x] Add edit client functionality
- [x] Display invoice count per client

#### Notes

- Client fields: Name*, Email*, Company, Phone, Address
- Client list shows total invoices and outstanding balance

</phase>

<phase number="8" title="Expense Tracking">

Add expense management so users can log, categorise, and view their business expenses.

#### Key Features

- View all expenses in a table (date, category, amount, description)
- Create new expense entry
- Edit existing expense
- Delete expense
- Category breakdown summary

#### Tasks

- [ ] Create expense list page with data table (date, category, description, amount)
- [ ] Build create expense form (amount*, date*, category\*, description, receipt notes)
- [ ] Add edit expense functionality
- [ ] Add delete expense with confirmation
- [ ] Add expense category summary cards (total per category)
- [ ] Add expenses to dashboard sidebar navigation

#### Notes

- Data source: Supabase (connected)
- Expense categories: Travel, Office Supplies, Software, Marketing, Utilities, Other
- Amounts in ZAR by default
- Add `expenses` table to Supabase schema
- RLS: users only see their own expenses

</phase>

<phase number="9" title="Dashboard Overview & Analytics">

Dashboard home with key metrics, recent activity, and quick actions.

#### Tasks

- [x] Create dashboard home page with metric cards
- [x] Add recent invoices widget
- [x] Build simple revenue chart
- [x] Add quick action buttons

#### Notes

- Metrics: Total Revenue, Pending Amount, Total Invoices, Active Clients
- Chart shows last 6 months revenue
- Quick actions: Create Invoice, Add Client

</phase>

<phase number="10" title="Email Invoice & PDF">

Send invoices by email with PDF attachments.

#### Tasks

- [x] Integrate email service (EmailJS)
- [x] Add PDF generation library for invoices
- [x] Create email template with invoice preview
- [x] Add "Send Invoice" button to invoice detail page
- [x] Change landing page currency default to ZAR
- [x] Update dashboard currency display to default ZAR

#### Notes

- Email service: EmailJS with environment variables
- PDF library: jsPDF for client-side generation
- **REQUIRES SETUP**: Configure EmailJS (see EMAILJS_SETUP.md)

</phase>

<phase number="11" title="Subscription Plan Management">

Let customers view their current plan, compare options, and upgrade/downgrade.

#### Tasks

- [ ] Create plans page showing current plan and usage
- [ ] Display plan comparison table
- [ ] Add upgrade/downgrade flow
- [ ] Show billing history

#### Notes

- Plans: Trial (R170 / 14-day free), Starter (R170/mo), Pro, Enterprise
- Billing history is mock data for now

</phase>

<phase number="12" title="Business Settings">

Business profile settings: logo, currency, address displayed on invoices.

#### Tasks

- [x] Create business settings page at /dashboard/settings
- [x] Build business info form (company name, email, phone, address)
- [x] Add logo upload functionality with preview
- [x] Add currency selector with common currencies
- [x] Save settings to Supabase

#### Notes

- Logo stored in Supabase Storage (business-logos bucket)
- Business info appears on generated invoices

</phase>

---

## 🔐 Authentication

<phase number="13" title="Authentication & Login System">

Login, signup, and protected routes with real Supabase Auth.

#### Tasks

- [x] Create login page with email/password form and validation
- [x] Create signup page with registration form
- [x] Integrate real Supabase Auth (replace mock auth)
- [x] Implement protected routes for dashboard and admin
- [x] Add logout button in dashboard/admin headers
- [ ] Fix login button not responding after demo user removal

#### Notes

- Login at /login, Signup at /signup
- After login: regular users → /dashboard, admins → /admin
- Forms use shadcn-ui with Zod validation
- Auth provider must use only Supabase — no demo/mock user fallbacks

</phase>

---

## 💳 Payments & Subscriptions

<phase number="14" title="PayFast Payment Integration">

PayFast payment gateway for invoice payments and subscription billing.

#### Tasks

- [x] Set up PayFast service and configuration
- [x] Add Pay Now button to invoices
- [x] Create payments table and webhook handler
- [x] Add payment history to invoices
- [x] Integrate subscription payments with PayFast
- [x] Test payment flow in sandbox mode

#### Notes

- PayFast supports ZAR natively
- Webhook URL must be publicly accessible
- **REQUIRES SETUP**: PayFast merchant account (see PAYFAST_SETUP.md)

</phase>

<phase number="15" title="Trial with Card & Auto-Subscription">

Card collection at trial signup with automatic Starter subscription after 14 days.

#### Tasks

- [x] Update Trial plan price to R170.00 in database and landing page
- [x] Add card collection step during signup/trial activation
- [x] Create trial period tracking (start_date, end_date)
- [x] Build trial countdown widget for dashboard
- [x] Implement auto-subscription service (daily check for expired trials)
- [x] Set up PayFast recurring payment for auto-subscription
- [x] Add email notifications (3 days before end, trial end, subscription activated)
- [x] Create trial-to-paid conversion tracking

#### Notes

- Card authorized but not charged during trial
- After 14 days: auto-charge R170.00 → activate Starter plan
- User can cancel before trial ends

</phase>

---

## 🏗️ Platform Structure

<phase number="16" title="Supabase Integration & Real Data">

Full Supabase database schema, real auth, RLS policies, and data migration.

#### Tasks

- [x] Create database schema (users, profiles, plans, invoices, clients, subscriptions, invoice_items)
- [x] Set up table relationships and foreign keys
- [x] Integrate Supabase Auth
- [x] Configure Supabase data provider in Refine
- [x] Migrate invoices, clients, plans to Supabase
- [x] Set up RLS policies for all tables

#### Notes

- Data source: Supabase (connected)
- RLS: users see own data, admins see all
- **IMPORTANT**: Run FOREIGN_KEYS_SETUP.sql in Supabase SQL Editor

</phase>

<phase number="17" title="File Structure Reorganization">

Separate landing page, customer dashboard, and admin into distinct directories.

#### Tasks

- [x] Create directory structure (pages/landing, pages/dashboard, pages/admin)
- [x] Move landing page files to pages/landing/
- [x] Move dashboard pages to pages/dashboard/
- [x] Update all import paths and route configurations

</phase>

<phase number="21" title="Route Restructuring">

Restructure customer app routes to match the intended SaaS URL structure.

#### Tasks

- [x] Rename `/signup` to `/register`
- [x] Move invoice routes from `/dashboard/invoices` to `/invoices`, `/invoices/create`, `/invoices/:id`, `/invoices/:id/edit`
- [x] Move client routes from `/dashboard/clients` to `/clients`, `/clients/create`, `/clients/:id/edit`
- [x] Move plans from `/dashboard/plans` to `/plans`
- [x] Move settings from `/dashboard/settings` to `/settings`
- [x] Add `/onboarding` as a new protected route (placeholder page for now)
- [x] Remove `/payments` route from customer app
- [x] Update all internal navigation links and sidebar to use new routes
- [x] Update Refine resource definitions to match new routes

#### Notes

- Public routes: `/`, `/login`, `/register`
- Protected routes: `/dashboard`, `/invoices/*`, `/clients/*`, `/plans`, `/settings`, `/onboarding`
- `/dashboard` remains as the home/overview page
- Admin stays at `/admin`
- `/payments` removed from customer-facing routes

</phase>

---

## 🛠️ Platform Admin (theinvoicepro.co.za/admin)

Separate admin interface for managing all tenants, plans, and platform-wide metrics. Only accessible to admin role users.

<phase number="18" title="Admin: Plan Management">

Admin interface to manage pricing tiers with full CRUD.

#### Tasks

- [x] Set up admin layout with sidebar navigation
- [x] Create plans list page showing all tiers
- [x] Build create/edit plan form (name, price, features, billing cycle)
- [x] Add activate/deactivate plan toggle

#### Notes

- Admin sidebar: Dashboard, Tenants, Plans, Metrics
- Plan fields: Name*, Price*, Currency, Features, Billing Cycle

</phase>

<phase number="19" title="Admin: Tenant Management">

Full tenant management — view all registered businesses, their subscriptions, and manage accounts.

#### Key Features

- View all tenants (businesses/users) with plan and status
- View tenant details (invoices count, clients, subscription history)
- Manually upgrade/downgrade a tenant's plan
- Suspend or reactivate a tenant account
- Delete a tenant account with confirmation
- Search and filter tenants by plan, status

#### Tasks

- [x] Create tenant list page (name, email, plan, status, joined date, invoice count)
- [x] Build tenant detail view with subscription history timeline
- [x] Add upgrade/downgrade plan modal
- [ ] Add suspend/reactivate account action
- [ ] Add delete tenant action with confirmation modal
- [ ] Add search bar and filter by plan/status

#### Notes

- "Tenant" = a registered business/user on the platform
- Suspension: sets account status to `suspended`, blocks dashboard access
- Deletion: soft delete (mark as deleted, retain data for 30 days)
- Admins can override any subscription manually

</phase>

<phase number="20" title="Admin: Platform Metrics">

Platform-wide analytics dashboard showing MRR, active tenants, churn, and plan distribution.

#### Tasks

- [x] Create admin dashboard home with metric cards (MRR, Active Tenants, Churn Rate, New Signups)
- [x] Build revenue chart by plan tier (last 6 months)
- [x] Display recent subscription activities widget
- [x] Add plan distribution pie/bar chart
- [x] Show growth metrics (new clients, upgrades, churn)

#### Notes

- All metrics pulled from Supabase
- Charts use recharts (already in project)

</phase>

<phase number="22" title="Admin: Route Restructuring">

Restructure the admin app to use clean, dedicated routes with its own login page.

#### Tasks

- [x] Create admin login page at `/login` with `VITE_AUTH_MODE=internal` message support
- [x] Set up admin protected routes: `/dashboard`, `/tenants`, `/tenants/:id`, `/tenants/:id/edit`, `/tiers`, `/tiers/:id/edit`, `/settings`
- [x] Update admin sidebar navigation links to match new route structure
- [x] Rename plan management routes from `/admin/plans` → `/tiers` and `/admin/plans/:id/edit` → `/tiers/:id/edit`
- [x] Rename tenant routes from `/admin/tenants` → `/tenants`, `/admin/tenants/:id` → `/tenants/:id`, `/admin/tenants/:id/edit` → `/tenants/:id/edit`
- [x] Ensure admin `/dashboard` is separate from customer `/dashboard`
- [x] Update all internal admin navigation links and Refine resource definitions

#### Notes

- Admin is a standalone app — routes are NOT prefixed with `/admin`
- Public route: `/login` (admin-specific login with internal auth mode message)
- Protected routes: `/dashboard`, `/tenants/*`, `/tiers/*`, `/settings`
- `VITE_AUTH_MODE=internal` shows explicit admin-only login message on login screen
- Admin authorization via Supabase role/claims/email allowlist

</phase>
