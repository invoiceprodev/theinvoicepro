# Supabase Database Schema

This document reflects the current Supabase schema used by the dashboard and admin app.

## Project

- Organization ID: `<your-supabase-org-id>`
- Project ID: `<your-supabase-project-id>`

## Tables

### `profiles`

Extends `auth.users` with tenant business settings.

Important fields:

- `auth0_user_id`
- `auth_provider`
- `role`
- `company_name`, `business_email`, `business_phone`, `business_address`
- `currency`, `logo_url`, `registration_number`
- `vat_enabled`, `vat_rate`, `vat_number`
- `default_language`, `invoice_prefix`, `default_payment_terms`
- `default_invoice_notes`, `default_invoice_terms`
- `last_login_at`

### `plans`

Subscription plans and pricing tiers.

Important fields:

- `name`, `description`
- `price`, `currency`, `billing_cycle`
- `features`
- `is_popular`, `trial_days`, `requires_card`, `auto_renew`
- `is_active`, `created_at`, `updated_at`

### `clients`

Customer records for each tenant.

Important fields:

- `user_id`
- `name`, `email`, `company`, `phone`, `address`
- `status` in `Active | Inactive | Suspended`

### `invoices`

Invoice headers.

Important fields:

- `invoice_number`
- `user_id`, `client_id`
- `invoice_date`, `due_date`
- `status` in `draft | sent | paid | pending | overdue`
- `currency`
- `subtotal`, `tax_percentage`, `tax_amount`
- `discount_type`, `discount`
- `total`, `notes`

### `invoice_items`

Line items for invoices.

Important fields:

- `invoice_id`
- `description`
- `quantity`
- `unit_price`
- `total`

### `expenses`

Expense tracking and VAT compliance source table.

Important fields:

- `user_id`
- `category` in `Pay Client | Pay Salary | Subscription | Operating Cost | Other`
- `recipient`
- `recipient_email`
- `recipient_phone`
- `recipient_company`
- `amount`, `currency`
- `payment_method`
- `date`
- `status` in `Pending | Paid | Cancelled`
- `vat_applicable`

### `subscriptions`

Tenant subscriptions and trial lifecycle.

### `payments`

Invoice and subscription payments.

### `trial_conversions`

Trial conversion tracking.

### `webhook_logs`

PayFast webhook audit records.

### `subscription_history`

Subscription audit trail.

## Status Enums

Invoice status:

- `draft`
- `sent`
- `paid`
- `pending`
- `overdue`

Client status:

- `Active`
- `Inactive`
- `Suspended`

Expense status:

- `Pending`
- `Paid`
- `Cancelled`

Subscription status:

- `trial`
- `active`
- `cancelled`
- `expired`

## RLS

RLS is enabled on all application tables.

- Users can access their own tenant data
- Admins can read broader operational data
- `plans` are publicly readable
- `expenses` follow the same owner/admin policy pattern as `clients` and `invoices`

## Setup Sources

- Full setup script: [`db/supabase_full_setup.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/supabase_full_setup.sql)
- Incremental alignment migration: [`db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql)
- Auth0 identity migration: [`db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql)
- Expense recipient migration: [`db/migrations/EXPENSE_RECIPIENT_DETAILS.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/EXPENSE_RECIPIENT_DETAILS.sql)

## Local Trial Testing

Current local testing can temporarily bypass card setup while PayFast is unresolved:

- `TRIAL_BYPASS_ENABLED=true`
- `VITE_TRIAL_BYPASS_ENABLED=true`

This is handled by the app and API, not by a Supabase schema change.
