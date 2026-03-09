# Business Settings Setup Guide

## Overview

Business Settings page (`/settings`) lets users manage their business profile, upload logos, and set default currency preferences.

## Required Manual Setup

### ⚠️ Two steps required in Supabase

#### Step 1: Run Database Migration

Run `db/migrations/BUSINESS_SETTINGS_MIGRATION.sql` in Supabase SQL Editor.

**How to run:**

1. Go to: `https://supabase.com/dashboard/project/<your-supabase-project-id>/sql/new`
2. Paste the SQL from `db/migrations/BUSINESS_SETTINGS_MIGRATION.sql`
3. Click "Run"

#### Step 2: Create Storage Bucket

See `db/setup/STORAGE_BUCKET_SETUP.md` for full instructions.

**Quick Setup:**

1. Go to Supabase Dashboard → Storage → Buckets
2. Create bucket named `company-branding` (Public: Yes, Size limit: 2MB)
3. No direct client upload policies are required if you are uploading through the API service-role path

## Usage

1. Navigate to `/settings` in the dashboard
2. Fill in company name, email, phone, address
3. Select default currency
4. Upload business logo (PNG, JPG, WEBP, or SVG, max 2MB)
5. Click "Save Settings"

## Database Schema Changes

```sql
profiles table additions:
  - company_name (text)
  - business_email (text)
  - business_phone (text)
  - business_address (text)
  - currency (text, default: 'ZAR')
  - logo_url (text)
```

## Storage Structure

```
company-branding/
  └── companies/
      └── {profile_id}/logo
```

## Troubleshooting

| Issue                 | Cause                              | Fix                                                     |
| --------------------- | ---------------------------------- | ------------------------------------------------------- |
| Empty settings form   | Migration not run                  | Execute `db/migrations/BUSINESS_SETTINGS_MIGRATION.sql` |
| Logo upload fails     | Bucket missing or policies not set | Follow `db/setup/STORAGE_BUCKET_SETUP.md`               |
| Currency doesn't save | Column missing in profiles         | Run the migration                                       |
