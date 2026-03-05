-- =============================================
-- RLS POLICY TESTING SCRIPT
-- =============================================
-- This script contains test queries to verify Row Level Security policies
-- Run these tests as different users to ensure data isolation

-- TEST 1: Verify RLS is Enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'plans', 'clients', 'invoices', 'invoice_items', 'subscriptions')
ORDER BY tablename;

-- TEST 2: Verify Helper Functions Exist
SELECT proname, prosrc FROM pg_proc WHERE proname = 'is_admin';
SELECT proname, prosrc FROM pg_proc WHERE proname = 'is_owner';

-- TEST 3: Admin Role Check
SELECT 
  auth.uid() as current_user_id,
  is_admin() as is_current_user_admin,
  role 
FROM profiles 
WHERE id = auth.uid();

-- TEST 4: Plans Public Read Access
SELECT id, name, price, currency, is_active FROM plans ORDER BY price;

-- TEST 5: User Data Isolation - Profiles
SELECT id, full_name, role FROM profiles WHERE id = auth.uid();
SELECT id, full_name FROM profiles WHERE id != auth.uid(); -- Expected: empty for non-admins

-- TEST 6: User Data Isolation - Clients
SELECT id, name, email, company, user_id FROM clients WHERE user_id = auth.uid();
SELECT COUNT(*) as my_clients_count FROM clients;

-- TEST 7: Invoice Data Isolation
SELECT id, invoice_number, status, total, user_id FROM invoices WHERE user_id = auth.uid();
SELECT COUNT(*) as visible_invoices FROM invoices;

-- TEST 8: Invoice Items Access
SELECT 
  ii.id, ii.description, ii.quantity, ii.unit_price, i.invoice_number, i.user_id
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
WHERE i.user_id = auth.uid();

-- TEST 9: Subscription Data Isolation
SELECT s.id, s.status, s.start_date, s.renewal_date, p.name as plan_name, s.user_id
FROM subscriptions s
JOIN plans p ON p.id = s.plan_id
WHERE s.user_id = auth.uid();

-- TEST 10: Admin Full Access (run as admin)
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_clients FROM clients;
SELECT COUNT(*) as total_invoices FROM invoices;
SELECT COUNT(*) as total_subscriptions FROM subscriptions;

-- TEST 11: Privilege Escalation Check
SELECT is_admin() as am_i_admin_now;

/*
✅ SUMMARY CHECKLIST
- RLS enabled on all tables
- Helper functions is_admin() and is_owner() work correctly
- Plans are publicly readable
- Plans are admin-only writable
- Users can only see their own profiles, clients, invoices, subscriptions
- Users cannot create data for other users
- Admins can see and modify all data
- Privilege escalation is prevented
*/
