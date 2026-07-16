# Supabase database setup for the client dashboard

This project already expects Supabase-backed resources for the dashboard pages. The migration in this folder creates the core tables and policies needed for:

- profiles
- plans and subscriptions
- clients
- invoices and invoice items
- expenses
- contracts
- subscription history
- trial conversions
- payments

## Apply the schema

1. Open your Supabase project.
2. Go to the SQL editor.
3. Run the contents of [migrations/20260716000000_init_dashboard_schema.sql](migrations/20260716000000_init_dashboard_schema.sql).
4. Optionally run [seed.sql](seed.sql) to seed the starter plan data.

## Required environment variables

Set these values in your frontend environment before running the app:

- VITE_SUPABASE_URL
- VITE_SUPABASE_API_KEY or VITE_SUPABASE_ANON_KEY
- VITE_SUPABASE_PROJECT_ID
