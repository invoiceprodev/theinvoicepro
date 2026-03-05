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
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:** `idx_profiles_role`

---

### 2. plans

Pricing tier definitions.

**Columns:**

- `id` (UUID, PK)
- `name` (TEXT, UNIQUE, NOT NULL) - Plan name
- `price` (DECIMAL(10,2), NOT NULL) - Plan price
- `currency` (TEXT, NOT NULL) - Default: 'USD'
- `billing_cycle` (TEXT, NOT NULL) - 'monthly' or 'yearly'
- `features` (JSONB) - Array of feature strings
- `is_active` (BOOLEAN, NOT NULL) - Plan availability
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:** `idx_plans_name`, `idx_plans_is_active`

**Seed Data:** Trial ($0), Starter ($9.99), Pro ($29.99), Enterprise ($99.99)

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
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:** `idx_subscriptions_user_id`, `idx_subscriptions_plan_id`, `idx_subscriptions_status`, `idx_subscriptions_renewal_date`

---

## Triggers & Functions

### Auto-update Timestamps

**Function:** `update_updated_at_column()`

- Automatically updates `updated_at` field on row updates
- Applied to: profiles, plans, clients, invoices, subscriptions

### Auto-create Profile

**Function:** `handle_new_user()`

- Automatically creates profile record when new user signs up
- Copies full_name from user metadata or uses email as fallback
- Sets default role as 'user'

---

## Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
    ├─→ clients (1:N) ─→ invoices (1:N) ─→ invoice_items (1:N)
    └─→ subscriptions (1:N) ←─ plans (N:1)
```

### Foreign Key Constraints

**⚠️ IMPORTANT:** Foreign key constraints must be added manually via Supabase SQL Editor.  
See `../setup/FOREIGN_KEYS_SETUP.sql` for the complete script.

#### Constraint Details:

1. **profiles.id → auth.users(id)**

   - Constraint: `fk_profiles_user_id`
   - Delete Rule: CASCADE (deleting auth user deletes profile)

2. **clients.user_id → profiles.id**

   - Constraint: `fk_clients_user_id`
   - Delete Rule: CASCADE (deleting profile deletes their clients)

3. **invoices.user_id → profiles.id**

   - Constraint: `fk_invoices_user_id`
   - Delete Rule: CASCADE (deleting profile deletes their invoices)

4. **invoices.client_id → clients.id**

   - Constraint: `fk_invoices_client_id`
   - Delete Rule: RESTRICT (cannot delete client with existing invoices)

5. **invoice_items.invoice_id → invoices.id**

   - Constraint: `fk_invoice_items_invoice_id`
   - Delete Rule: CASCADE (deleting invoice deletes its line items)

6. **subscriptions.user_id → profiles.id**

   - Constraint: `fk_subscriptions_user_id`
   - Delete Rule: CASCADE (deleting profile deletes their subscriptions)

7. **subscriptions.plan_id → plans.id**
   - Constraint: `fk_subscriptions_plan_id`
   - Delete Rule: RESTRICT (cannot delete plan with active subscriptions)

### Performance Indexes

All foreign key columns have indexes for optimal query performance:

- `idx_profiles_id` - Profiles primary key lookup
- `idx_clients_user_id` - Client queries by user
- `idx_invoices_user_id` - Invoice queries by user
- `idx_invoices_client_id` - Invoice queries by client
- `idx_invoice_items_invoice_id` - Line items by invoice
- `idx_subscriptions_user_id` - Subscriptions by user
- `idx_subscriptions_plan_id` - Subscriptions by plan

**Composite Indexes for Common Queries:**

- `idx_invoices_user_status` - User invoices filtered by status
- `idx_invoices_client_date` - Client invoices sorted by date
- `idx_subscriptions_user_status` - Active subscriptions by user
- `idx_clients_user_email` - Client lookup by user and email

---

## Status Enums

**Invoice Status:**

- `paid` - Invoice has been paid
- `pending` - Awaiting payment
- `overdue` - Past due date

**Subscription Status:**

- `trial` - Free trial period
- `active` - Active paid subscription
- `cancelled` - Cancelled but may still have access
- `expired` - Subscription has ended

**User Roles:**

- `user` - Regular client dashboard access
- `admin` - Full admin dashboard access

---

## Next Steps

1. ✅ Database schema created
2. ⚠️ **Set up table relationships and foreign keys** (requires manual execution - see `../setup/FOREIGN_KEYS_SETUP.sql`)
3. ⏭️ Integrate Supabase Auth (Task 3)
4. ⏭️ Configure Supabase data provider (Task 4)
5. ⏭️ Set up Row Level Security (RLS) policies (Task 7)
