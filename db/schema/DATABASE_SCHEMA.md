# Database Schema Documentation

## Overview

Current Supabase schema for TheInvoicePro.

**Organization ID:** `<your-supabase-org-id>`  
**Project ID:** `<your-supabase-project-id>`

## Core Tables

### `profiles`

Extends `auth.users` with business and dashboard settings.

Key columns:

- `id` UUID PK, references `auth.users(id)`
- `auth0_user_id`
- `auth_provider`
- `full_name`
- `role` in `user | admin`
- `company_name`, `business_email`, `business_phone`, `business_address`
- `currency`, `logo_url`, `registration_number`
- `vat_enabled`, `vat_rate`, `vat_number`
- `default_language`, `invoice_prefix`, `default_payment_terms`
- `default_invoice_notes`, `default_invoice_terms`
- `last_login_at`
- `created_at`, `updated_at`

Indexes:

- `idx_profiles_role`
- `idx_profiles_currency`
- `idx_profiles_vat_enabled`
- `idx_profiles_auth_provider`

### `plans`

Subscription pricing tiers.

Key columns:

- `name`
- `description`
- `price`
- `currency`
- `billing_cycle` in `monthly | yearly`
- `features` JSONB
- `is_popular`
- `trial_days`
- `requires_card`
- `auto_renew`
- `is_active`

Seed data:

- Starter/Trial `R150`
- Pro `R320`
- Enterprise `R480`

### `clients`

Tenant-owned customer records.

Key columns:

- `id`
- `user_id`
- `name`, `email`, `company`, `phone`, `address`
- `status` in `Active | Inactive | Suspended`
- `created_at`, `updated_at`

Indexes:

- `idx_clients_user_id`
- `idx_clients_email`
- `idx_clients_status`
- `idx_clients_user_status`

### `invoices`

Invoice headers.

Key columns:

- `id`
- `invoice_number`
- `user_id`
- `client_id`
- `invoice_date`, `due_date`
- `status` in `draft | sent | paid | pending | overdue`
- `currency`
- `subtotal`, `tax_percentage`, `tax_amount`
- `discount_type` in `percentage | fixed`
- `discount`
- `total`
- `notes`
- `created_at`, `updated_at`

Indexes:

- `idx_invoices_user_id`
- `idx_invoices_client_id`
- `idx_invoices_status`
- `idx_invoices_invoice_number`
- `idx_invoices_invoice_date`
- `idx_invoices_currency`
- `idx_invoices_user_status`
- `idx_invoices_client_date`
- `idx_invoices_user_due_date`

### `invoice_items`

Invoice line items.

Key columns:

- `invoice_id`
- `description`
- `quantity`
- `unit_price`
- `total`
- `created_at`

### `expenses`

Tenant-owned business expenses used by the dashboard and compliance pages.

Key columns:

- `id`
- `user_id`
- `category` in `Pay Client | Pay Salary | Subscription | Operating Cost | Other`
- `recipient`
- `recipient_email`
- `recipient_phone`
- `recipient_company`
- `amount`
- `currency`
- `payment_method` in `Bank Transfer | Cash | Card | EFT`
- `date`
- `status` in `Pending | Paid | Cancelled`
- `notes`
- `vat_applicable`
- `created_at`, `updated_at`

Indexes:

- `idx_expenses_user_id`
- `idx_expenses_status`
- `idx_expenses_category`
- `idx_expenses_date`
- `idx_expenses_user_date`
- `idx_expenses_user_status`
- `idx_expenses_user_category`

### `subscriptions`

User subscriptions to plans.

Key columns:

- `user_id`
- `plan_id`
- `status` in `trial | active | cancelled | expired`
- `start_date`, `end_date`, `renewal_date`
- `payfast_token`
- `trial_start_date`, `trial_end_date`
- `auto_renew`
- `created_at`, `updated_at`

### `payments`

Payment transactions for invoices and subscriptions.

Key columns:

- `user_id`
- `subscription_id`
- `invoice_id`
- `amount`
- `currency`
- `payment_method`
- `status` in `pending | completed | failed`
- `payfast_payment_id`
- `transaction_reference`
- `created_at`, `updated_at`

### `trial_conversions`

Trial-to-paid conversion tracking.

Key columns:

- `user_id`
- `trial_start_date`, `trial_end_date`
- `conversion_date`
- `status` in `active_trial | converted | cancelled | failed`
- `payment_id`
- `subscription_id`
- `failure_reason`
- `notes`
- `created_at`, `updated_at`

### `webhook_logs`

PayFast webhook audit records.

### `subscription_history`

Audit trail for subscription lifecycle changes.

## Relationships

```text
auth.users
  -> profiles
      -> clients
      -> invoices
          -> invoice_items
      -> expenses
      -> subscriptions
          -> payments
      -> trial_conversions

plans -> subscriptions
clients -> invoices
invoices -> invoice_items
```

## RLS Summary

RLS is enabled on all business tables.

- Users can manage their own `profiles`, `clients`, `invoices`, `invoice_items`, `expenses`, `subscriptions`, and `payments`
- Admins can view all tenant data
- `plans` are publicly readable
- `webhook_logs` allow system inserts and scoped reads

## Triggers and Functions

Functions:

- `is_admin()`
- `is_owner(uuid)`
- `update_updated_at_column()`
- `handle_new_user()`
- `log_subscription_changes()`

Updated-at triggers are applied to:

- `profiles`
- `plans`
- `clients`
- `invoices`
- `expenses`
- `subscriptions`
- `payments`
- `trial_conversions`

## Canonical Setup Files

- Full setup: [`db/supabase_full_setup.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/supabase_full_setup.sql)
- Alignment migration: [`db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/DASHBOARD_SCHEMA_ALIGNMENT.sql)
- Auth0 identity migration: [`db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql)
- Expense recipient migration: [`db/migrations/EXPENSE_RECIPIENT_DETAILS.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/EXPENSE_RECIPIENT_DETAILS.sql)

## Local Trial Bypass Note

For local or staging validation while PayFast is unresolved, the app can temporarily activate trials without card setup by enabling:

- `TRIAL_BYPASS_ENABLED=true`
- `VITE_TRIAL_BYPASS_ENABLED=true`

This is an application-level testing path. It does not change the database schema.
