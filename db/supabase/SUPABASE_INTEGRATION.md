# Supabase Integration Guide

## Database Connection

**Organization ID:** dflsfsnzbhtcvucazyhl  
**Project ID:** pfhbexbmarxelehrdcuz

---

## Setup Progress

### ✅ Phase 1: Schema Creation (Completed)

All tables, triggers, and functions have been created:

- ✅ profiles (with business settings columns)
- ✅ plans (with seed data)
- ✅ clients
- ✅ invoices
- ✅ invoice_items
- ✅ subscriptions (with trial tracking columns)
- ✅ payments
- ✅ trial_conversions
- ✅ Auto-update timestamp triggers
- ✅ Auto-create profile trigger

**Reference:** See `db/supabase/DATABASE_SCHEMA.md` for complete schema documentation.

---

### ✅ Phase 2: Foreign Key Relationships

**Action Required (one-time):** Execute `db/setup/FOREIGN_KEYS_SETUP.sql` in Supabase SQL Editor

**How to Execute:**

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `db/setup/FOREIGN_KEYS_SETUP.sql`
3. Execute and verify with the queries at the bottom of the script

---

### ✅ Phase 3: Row Level Security

All tables protected with RLS policies. See `db/supabase/RLS_POLICIES.md`.

---

### ✅ Phase 4: Auth Integration

Supabase Auth integrated. Profiles auto-created via `handle_new_user()` trigger.

---

## Verification Checklist

- [ ] All foreign key constraints are created (`db/setup/FOREIGN_KEYS_SETUP.sql`)
- [ ] RLS enabled on all tables
- [ ] `business-logos` storage bucket created (`db/setup/STORAGE_BUCKET_SETUP.md`)
- [ ] Payments table created (`db/setup/PAYMENTS_TABLE_SETUP.sql`)
- [ ] Trial analytics table created (`db/migrations/TRIAL_ANALYTICS_MIGRATION.sql`)
- [ ] Business settings migration run (`db/migrations/BUSINESS_SETTINGS_MIGRATION.sql`)

---

## Troubleshooting

### Error: "constraint already exists"

Some constraints may already be in place. Safe to ignore or use `DROP CONSTRAINT` first.

### Error: "violates foreign key constraint"

Existing data may violate the relationship. Clean up orphaned records first.

### Performance Issues

Ensure all indexes are created. Check with `\d+ table_name` in psql.
