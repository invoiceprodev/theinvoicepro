# Data Migration Guide - Mock to Supabase

## Overview

This guide explains how to migrate from mock data to Supabase for invoices and clients.

## What Changed

- **Invoice List** — fetches from Supabase `invoices` table with client relationship
- **Client List** — fetches from Supabase `clients` table
- **Types** (`src/types.ts`) — updated to include optional `client` relation in Invoice type

## Seeding Sample Data

See `db/seeds/seed-data.sql` for the full seed script.

### Quick Steps

1. Log in to Supabase Dashboard → SQL Editor
2. Get your user ID: `SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL';`
3. Open `db/seeds/seed-data.sql`
4. Replace `YOUR_USER_ID` with your actual user ID
5. Run the script

### Verification

```sql
SELECT 'Clients' as type, COUNT(*)::text as count
FROM clients WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Invoices', COUNT(*)::text
FROM invoices WHERE user_id = 'YOUR_USER_ID';
```

## Troubleshooting

**No data showing up?**

1. Check you're logged in with the correct user
2. Verify RLS policies are enabled
3. Check browser console for API errors
4. Ensure Supabase environment variables are set

**Client data not showing in invoices?**

- Ensure foreign key relationships are set up (`db/setup/FOREIGN_KEYS_SETUP.sql`)
