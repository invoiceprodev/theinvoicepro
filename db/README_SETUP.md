# TheInvoicePro — Supabase Database Setup

This guide explains how to run the consolidated database setup script in Supabase.

---

## Prerequisites

- A Supabase project created and accessible
- Supabase project credentials added to your `.env` file:
  ```
  VITE_SUPABASE_URL=https://your_project_id.supabase.co
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```
  or the Refine-generated equivalent:
  ```
  VITE_SUPABASE_PROJECT_ID=your_project_id
  VITE_SUPABASE_API_KEY=your_anon_key
  ```
- Access to the **Supabase SQL Editor** (Dashboard → SQL Editor)

---

## Running the Setup Script

### Step 1 — Open the SQL Editor

1. Go to [supabase.com](https://supabase.com) and log in
2. Select your project (`<your-supabase-project-id>`)
3. In the left sidebar click **SQL Editor**
4. Click **+ New query**

---

### Step 2 — Paste and Run the Script

1. Open the file **`db/supabase_full_setup.sql`** in your editor
2. Select all content (`Ctrl+A` / `Cmd+A`) and copy it
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

> **The script is safe to re-run.** It uses `CREATE TABLE IF NOT EXISTS`,
> `DROP POLICY IF EXISTS`, `DROP TRIGGER IF EXISTS`, and `ON CONFLICT DO UPDATE`
> throughout, so running it multiple times will not duplicate data or throw errors.

---

### Step 3 — Verify the Setup

After the script completes, run these quick verification queries in a new SQL Editor tab:

```sql
-- 1. Confirm all tables exist with RLS enabled
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Confirm plan seed data
SELECT name, price, currency, is_active
FROM plans
ORDER BY price;

-- 3. Confirm foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. Confirm indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Expected results:**

| Check        | Expected                                             |
| ------------ | ---------------------------------------------------- |
| Tables       | 10 tables, all with `rls_enabled = true`             |
| Plans        | Starter/Trial R150, Pro R320, Enterprise R480 |
| Foreign keys | 8+ constraints across tables                         |
| Indexes      | 30+ indexes                                          |

---

### Step 4 — Create the Storage Bucket (Manual)

The logo upload feature requires a Supabase Storage bucket:

1. In the Supabase Dashboard go to **Storage**
2. Click **New bucket**
3. Name it: `company-branding`
4. Set it to **Public**
5. Click **Create bucket**

This should match:

```env
SUPABASE_BRANDING_BUCKET=company-branding
```

See `db/setup/STORAGE_BUCKET_SETUP.md` for full bucket policy details.

---

## What the Script Creates

### Tables (in creation order)

| Table                  | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `plans`                | Pricing tiers (Starter/Trial, Pro, Enterprise)          |
| `profiles`             | User profiles extending `auth.users` with business info |
| `clients`              | Customer/client records owned by a profile              |
| `invoices`             | Invoice header records                                  |
| `invoice_items`        | Line items belonging to an invoice                      |
| `subscriptions`        | User subscriptions to pricing plans                     |
| `payments`             | PayFast payment transaction records                     |
| `trial_conversions`    | Trial-to-paid conversion tracking                       |
| `webhook_logs`         | PayFast webhook event audit log                         |
| `subscription_history` | Audit trail of all subscription changes                 |

### Functions & Triggers

| Name                         | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `is_admin()`                 | Helper: returns true if caller has `role = 'admin'`             |
| `is_owner(uuid)`             | Helper: returns true if caller owns the row                     |
| `update_updated_at_column()` | Auto-updates `updated_at` on every row update                   |
| `handle_new_user()`          | Auto-creates a `profiles` row when a new auth user signs up     |
| `log_subscription_changes()` | Appends to `subscription_history` on subscription INSERT/UPDATE |

### RLS Policies (summary)

| Table                  | Users                        | Admins                   |
| ---------------------- | ---------------------------- | ------------------------ |
| `profiles`             | View & update own row        | View & update all        |
| `plans`                | Read only (public)           | Full CRUD                |
| `clients`              | Full CRUD on own records     | Read all                 |
| `invoices`             | Full CRUD on own records     | Read all                 |
| `invoice_items`        | Full CRUD via parent invoice | Read all                 |
| `subscriptions`        | View, insert, update own     | Full CRUD                |
| `payments`             | View, insert, update own     | Full CRUD                |
| `trial_conversions`    | View own                     | View, insert, update all |
| `webhook_logs`         | View own-related logs        | View all                 |
| `subscription_history` | View own                     | View all                 |

### Seed Data

| Plan          | Price   | Currency | Cycle   |
| ------------- | ------- | -------- | ------- |
| Starter/Trial | R150.00 | ZAR      | monthly |
| Pro           | R320.00 | ZAR      | monthly |
| Enterprise    | R480.00 | ZAR      | monthly |

---

## Current Incremental Migrations Often Needed

If the project has already been created from an older schema, also run the newer migrations that match the current app:

- [`db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_IDENTITY_ALIGNMENT.sql)
- [`db/migrations/AUTH0_PROFILE_DECOUPLING.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AUTH0_PROFILE_DECOUPLING.sql)
- [`db/migrations/PLAN_METADATA_ALIGNMENT.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/PLAN_METADATA_ALIGNMENT.sql)
- [`db/migrations/EXPENSE_RECIPIENT_DETAILS.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/EXPENSE_RECIPIENT_DETAILS.sql)

---

## Local Trial Bypass Note

For local or staging app testing while PayFast is unresolved, the app can temporarily activate trials without card setup when these env flags are enabled:

```env
TRIAL_BYPASS_ENABLED=true
VITE_TRIAL_BYPASS_ENABLED=true
```

This bypass is application-level only. It is not created by SQL and does not change the Supabase schema.

---

## Optional: Add Sample Data

To seed sample clients and invoices for a specific user, edit and run `db/seeds/seed-data.sql`.
Replace `'YOUR_USER_ID'` with your actual user UUID:

```sql
-- Get your user ID
SELECT id FROM auth.users WHERE email = 'your-email@example.com';
```

Then paste that ID into the seed script and run it.

---

## Troubleshooting

### "constraint already exists"

The FK constraint is already in place. Safe to ignore, or run:

```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_user_id;
```

before re-running the script.

### "relation does not exist"

Ensure you are running the script in the `public` schema context. The SQL Editor defaults to `public`.

### "permission denied"

You must run this script as the **postgres** (service role) user via the SQL Editor. The anon key does not have DDL permissions.

### RLS blocks your own queries

Check that `profiles.role` is set correctly for your user:

```sql
SELECT id, role FROM profiles WHERE id = auth.uid();
```

To make a user an admin:

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

### Plans not visible on landing page

Verify the public SELECT policy exists on `plans`:

```sql
SELECT * FROM pg_policies WHERE tablename = 'plans';
```

The policy `"Plans are publicly readable"` should have `qual = '(true)'`.

---

## Related Files

| File                               | Purpose                             |
| ---------------------------------- | ----------------------------------- |
| `db/supabase_full_setup.sql`       | **Main script — run this**          |
| `db/supabase/DATABASE_SCHEMA.md`   | Detailed column-level schema docs   |
| `db/supabase/RLS_POLICIES.md`      | RLS policy rationale and patterns   |
| `db/setup/STORAGE_BUCKET_SETUP.md` | Storage bucket for business logos   |
| `db/seeds/seed-data.sql`           | Optional sample client/invoice data |
| `db/setup/RLS_TEST_GUIDE.sql`      | Queries to verify RLS is working    |
