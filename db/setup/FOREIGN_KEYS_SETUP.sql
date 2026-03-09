-- =============================================
-- FOREIGN KEY RELATIONSHIPS & CONSTRAINTS
-- =============================================
-- Execute this script in Supabase SQL Editor to add foreign key relationships
-- Organization ID: <your-supabase-org-id>
-- Project ID: <your-supabase-project-id>

-- 1. profiles.id → auth.users(id)
-- CASCADE DELETE: When auth user is deleted, profile is deleted
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_user_id 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 2. clients.user_id → profiles.id
-- CASCADE DELETE: When profile is deleted, their clients are deleted
ALTER TABLE clients
ADD CONSTRAINT fk_clients_user_id 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 3. invoices.user_id → profiles.id
-- CASCADE DELETE: When profile is deleted, their invoices are deleted
ALTER TABLE invoices
ADD CONSTRAINT fk_invoices_user_id 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 4. invoices.client_id → clients.id
-- RESTRICT DELETE: Cannot delete client if they have invoices
-- (Protects data integrity - admin must reassign or delete invoices first)
ALTER TABLE invoices
ADD CONSTRAINT fk_invoices_client_id 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE RESTRICT;

-- 5. invoice_items.invoice_id → invoices.id
-- CASCADE DELETE: When invoice is deleted, all its line items are deleted
ALTER TABLE invoice_items
ADD CONSTRAINT fk_invoice_items_invoice_id 
FOREIGN KEY (invoice_id) 
REFERENCES invoices(id) 
ON DELETE CASCADE;

-- 6. subscriptions.user_id → profiles.id
-- CASCADE DELETE: When profile is deleted, their subscriptions are deleted
ALTER TABLE subscriptions
ADD CONSTRAINT fk_subscriptions_user_id 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- 7. subscriptions.plan_id → plans.id
-- RESTRICT DELETE: Cannot delete plan if users are subscribed to it
-- (Protects data integrity - must migrate users first)
ALTER TABLE subscriptions
ADD CONSTRAINT fk_subscriptions_plan_id 
FOREIGN KEY (plan_id) 
REFERENCES plans(id) 
ON DELETE RESTRICT;

-- =============================================
-- PERFORMANCE INDEXES ON FOREIGN KEYS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- =============================================
-- ADDITIONAL COMPOSITE INDEXES FOR COMMON QUERIES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_date ON invoices(client_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_user_email ON clients(user_id, email);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
