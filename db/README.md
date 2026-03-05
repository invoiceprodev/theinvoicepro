# /db — Database Files Directory

This directory contains all database-related files for the TheInvoicePro platform.

## Directory Structure

```
db/
├── migrations/          # Incremental schema changes (run in order)
│   ├── BUSINESS_SETTINGS_MIGRATION.sql
│   ├── PAYFAST_WEBHOOK_LOGS_TABLE.sql
│   ├── SUBSCRIPTION_TOKEN_MIGRATION.sql
│   ├── TRIAL_ANALYTICS_MIGRATION.sql
│   ├── TRIAL_CARD_COLLECTION_MIGRATION.sql
│   └── TRIAL_TRACKING_MIGRATION.sql
│
├── setup/               # One-off setup scripts (run once on new environments)
│   ├── FOREIGN_KEYS_SETUP.sql
│   ├── PAYMENTS_TABLE_SETUP.sql
│   ├── RLS_TEST_GUIDE.sql
│   ├── STORAGE_BUCKET_SETUP.md
│   └── SUBSCRIPTION_HISTORY_SETUP.md
│
├── seeds/               # Sample / test data
│   └── seed-data.sql
│
├── supabase/            # Supabase-specific docs and schema references
│   ├── DATABASE_SCHEMA.md
│   ├── RLS_POLICIES.md
│   ├── SUPABASE_INTEGRATION.md
│   └── SUPABASE_TESTING_REPORT.md
│
└── docs/                # Feature-specific database setup guides
    ├── BUSINESS_SETTINGS_SETUP.md
    ├── INVOICE_EMAIL_USAGE.md
    ├── MIGRATION_GUIDE.md
    ├── PAYFAST_SETUP.md
    ├── PAYFAST_WEBHOOK_SETUP.md
    ├── SUBSCRIPTION_API_USAGE.md
    ├── TRIAL_ANALYTICS_SETUP.md
    ├── TRIAL_AUTO_SUBSCRIPTION_README.md
    ├── TRIAL_CARD_COLLECTION_SETUP.md
    ├── TRIAL_CONVERSION_SETUP.md
    └── TRIAL_EMAIL_USAGE.md
```

---

## Supabase Connection

- **Organization ID:** `dflsfsnzbhtcvucazyhl`
- **Project ID:** `pfhbexbmarxelehrdcuz`
- **Dashboard:** https://supabase.com/dashboard/project/pfhbexbmarxelehrdcuz

---

## Quick-Start Checklist (New Environment)

Run these in order in the Supabase SQL Editor:

1. ✅ Core schema already created via Supabase dashboard
2. ⚠️ `db/setup/FOREIGN_KEYS_SETUP.sql` — Add FK constraints + indexes
3. ⚠️ `db/setup/PAYMENTS_TABLE_SETUP.sql` — Create payments table
4. ⚠️ `db/migrations/BUSINESS_SETTINGS_MIGRATION.sql` — Add business profile columns
5. ⚠️ `db/migrations/TRIAL_TRACKING_MIGRATION.sql` — Add trial date columns
6. ⚠️ `db/migrations/TRIAL_CARD_COLLECTION_MIGRATION.sql` — Add payfast_token column
7. ⚠️ `db/migrations/TRIAL_ANALYTICS_MIGRATION.sql` — Create trial_conversions table
8. ⚠️ `db/migrations/SUBSCRIPTION_TOKEN_MIGRATION.sql` — Add subscription token support
9. ⚠️ `db/setup/STORAGE_BUCKET_SETUP.md` — Create `business-logos` storage bucket (manual)

---

## Seed Data

To populate a new environment with test data:

1. Open `db/seeds/seed-data.sql`
2. Replace `YOUR_USER_ID` with your actual user UUID
3. Run in Supabase SQL Editor

---

## Notes

- **Do NOT** put TypeScript/JavaScript source files here — only SQL, schema, and DB docs
- Always test migrations in a staging environment before running in production
- RLS policies are documented in `db/supabase/RLS_POLICIES.md`
- For PayFast webhook setup, see `db/docs/PAYFAST_WEBHOOK_SETUP.md`
