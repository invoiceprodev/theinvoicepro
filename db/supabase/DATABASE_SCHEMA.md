# Database Schema Documentation

## Overview

Complete database schema for the Online Invoicing System created in Supabase.

**Organization ID:** dflsfsnzbhtcvucazyhl  
**Project ID:** pfhbexbmarxelehrdcuz

## Tables Created

### 1. profiles

Extends `auth.users` with additional user information.

**Columns:**

- `id` (UUID, PK) - References auth.users(id)
- `full_name` (TEXT) - User's full name
- `role` (TEXT, NOT NULL) - User role: 'user' or 'admin'
- `avatar_url` (TEXT) - Profile avatar URL
- `company_name` (TEXT) - Business/company name for invoicing
- `business_email` (TEXT) - Business contact email
- `business_phone` (TEXT) - Business contact phone
- `business_address` (TEXT) - Business address for invoices
- `currency` (TEXT) - Default currency (default: 'USD')
- `logo_url` (TEXT) - Business logo URL from Supabase Storage
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:** `idx_profiles_role`, `idx_profiles_currency`

---

### 2. plans

Pricing tier definitions.

**Columns:**

- `id` (UUID, PK)
- `name` (TEXT, UNIQUE, NOT NULL) - Plan name
- `price` (DECIMAL(10,2), NOT NULL) - Plan price
- `currency` (TEXT, NOT NULL) - Default: 'ZAR'
- `billing_cycle` (TEXT, NOT NULL) - 'monthly' or 'yearly'
- `features` (JSONB) - Array of feature strings
- `is_active` (BOOLEAN, NOT NULL) - Plan availability
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:** `idx_plans_name`, `idx_plans_is_active`

**Seed Data:** Trial (R170), Starter (R170/mo), Pro, Enterprise

---

### 3. clients

Customer information for invoicing.

**Columns:**

- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles.id, NOT NULL) - Owner of the client
- `name` (TEXT, NOT NULL) - Client name
- `email` (TEXT, NOT NULL) - Client email
- `company` (TEXT) - Company name
- `phone` (TEXT) - Phone number
- `address` (TEXT) - Full address
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:** `idx_clients_user_id`, `idx_clients_email`

---

### 4. invoices

Invoice header information.

**Columns:**

- `id` (UUID, PK)
- `invoice_number` (TEXT, UNIQUE, NOT NULL) - Unique invoice identifier
- `user_id` (UUID, FK → profiles.id, NOT NULL) - Invoice owner
- `client_id` (UUID, FK → clients.id, NOT NULL) - Invoice client
- `invoice_date` (DATE, NOT NULL) - Invoice issue date
- `due_date` (DATE, NOT NULL) - Payment due date
- `status` (TEXT, NOT NULL) - 'paid', 'pending', or 'overdue'
- `subtotal` (DECIMAL(10,2), NOT NULL) - Pre-tax amount
- `tax_percentage` (DECIMAL(5,2), NOT NULL) - Tax rate
- `tax_amount` (DECIMAL(10,2), NOT NULL) - Calculated tax
- `total` (DECIMAL(10,2), NOT NULL) - Final amount
- `notes` (TEXT) - Additional notes
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:** `idx_invoices_user_id`, `idx_invoices_client_id`, `idx_invoices_status`, `idx_invoices_invoice_number`, `idx_invoices_invoice_date`

---

### 5. invoice_items

Line items for each invoice.

**Columns:**

- `id` (UUID, PK)
- `invoice_id` (UUID, FK → invoices.id, NOT NULL) - Parent invoice
- `description` (TEXT, NOT NULL) - Item description
- `quantity` (DECIMAL(10,2), NOT NULL) - Item quantity
- `unit_price` (DECIMAL(10,2), NOT NULL) - Price per unit
- `total` (DECIMAL(10,2), NOT NULL) - Line item total
- `created_at` (TIMESTAMPTZ)

**Indexes:** `idx_invoice_items_invoice_id`

**Cascade Delete:** Items are deleted when parent invoice is deleted

---

### 6. subscriptions

User subscription to pricing plans.

**Columns:**

- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles.id, NOT NULL) - Subscriber
- `plan_id` (UUID, FK → plans.id, NOT NULL) - Subscribed plan
- `status` (TEXT, NOT NULL) - 'active', 'cancelled', 'expired', or 'trial'
- `start_date` (DATE, NOT NULL) - Subscription start
- `end_date` (DATE) - Subscription end (if cancelled/expired)
- `renewal_date` (DATE) - Next renewal date
- `payfast_token` (TEXT) - PayFast token for recurring billing
- `trial_start_date` (TIMESTAMPTZ) - Trial period start
- `trial_end_date` (TIMESTAMPTZ) - Trial period end (14 days from start)
- `auto_renew` (BOOLEAN) - Whether to auto-renew after trial
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:** `idx_subscriptions_user_id`, `idx_subscriptions_plan_id`, `idx_subscriptions_status`, `idx_subscriptions_renewal_date`, `idx_subscriptions_payfast_token`, `idx_subscriptions_trial_end_date`

---

### 7. payments

Payment transaction records.

**Columns:**

- `id` (UUID, PK)
- `subscription_id` (UUID, FK → subscriptions.id)
- `invoice_id` (UUID, FK → invoices.id)
- `user_id` (UUID, FK → profiles.id, NOT NULL)
- `amount` (NUMERIC(10,2), NOT NULL)
- `currency` (TEXT, NOT NULL, default: 'ZAR')
- `payment_method` (TEXT, NOT NULL, default: 'payfast')
- `status` (TEXT, NOT NULL) - 'pending', 'completed', 'failed'
- `payfast_payment_id` (TEXT) - PayFast transaction ID
- `transaction_reference` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

### 8. trial_conversions

Trial-to-paid conversion tracking and analytics.

**Columns:**

- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles.id, NOT NULL)
- `trial_start_date` (TIMESTAMPTZ, NOT NULL)
- `trial_end_date` (TIMESTAMPTZ, NOT NULL)
- `conversion_date` (TIMESTAMPTZ) - When successfully converted
- `status` (TEXT, NOT NULL) - 'active_trial', 'converted', 'cancelled', 'failed'
- `payment_id` (UUID, FK → payments.id)
- `subscription_id` (UUID, FK → subscriptions.id)
- `failure_reason` (TEXT)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## Triggers & Functions

### Auto-update Timestamps

**Function:** `update_updated_at_column()`
Applied to: profiles, plans, clients, invoices, subscriptions, payments, trial_conversions

### Auto-create Profile

**Function:** `handle_new_user()`
Automatically creates profile record when new user signs up via Supabase Auth.

---

## Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
    ├─→ clients (1:N) ─→ invoices (1:N) ─→ invoice_items (1:N)
    ├─→ subscriptions (1:N) ←─ plans (N:1)
    ├─→ payments (1:N)
    └─→ trial_conversions (1:N)
```

---

## Foreign Key Constraints

See `db/setup/FOREIGN_KEYS_SETUP.sql` for the complete script.

---

## Status Enums

**Invoice Status:** `paid`, `pending`, `overdue`

**Subscription Status:** `trial`, `active`, `cancelled`, `expired`

**Trial Conversion Status:** `active_trial`, `converted`, `cancelled`, `failed`

**User Roles:** `user`, `admin`
