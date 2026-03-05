-- Seed script for sample invoices and clients
-- Run this in Supabase SQL Editor after authenticating a user

-- Note: Replace 'YOUR_USER_ID' with the actual user_id from auth.users table
-- You can get it by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Insert sample clients
INSERT INTO clients (user_id, name, email, company, phone, address) VALUES
  ('YOUR_USER_ID', 'Acme Corporation', 'contact@acme.com', 'Acme Corp', '+1-555-0101', '123 Business St, New York, NY 10001'),
  ('YOUR_USER_ID', 'TechStart Inc', 'hello@techstart.io', 'TechStart', '+1-555-0102', '456 Innovation Ave, San Francisco, CA 94102'),
  ('YOUR_USER_ID', 'Global Solutions', 'info@globalsolutions.com', 'Global Solutions LLC', '+1-555-0103', '789 Enterprise Blvd, Austin, TX 78701')
ON CONFLICT (user_id, email) DO NOTHING;

-- Insert sample invoices
-- Note: Replace client_id values with actual IDs from the clients table
WITH client_ids AS (
  SELECT id, name FROM clients WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at LIMIT 3
)
INSERT INTO invoices (user_id, client_id, invoice_number, invoice_date, due_date, subtotal, tax, total, status, notes)
SELECT 
  'YOUR_USER_ID',
  (SELECT id FROM client_ids WHERE name = 'Acme Corporation'),
  'INV-2024-001',
  '2024-01-15',
  '2024-02-15',
  5000.00,
  500.00,
  5500.00,
  'paid',
  'Website development project - Phase 1'
UNION ALL
SELECT 
  'YOUR_USER_ID',
  (SELECT id FROM client_ids WHERE name = 'TechStart Inc'),
  'INV-2024-002',
  '2024-01-20',
  '2024-02-20',
  3500.00,
  350.00,
  3850.00,
  'pending',
  'Mobile app UI design'
UNION ALL
SELECT 
  'YOUR_USER_ID',
  (SELECT id FROM client_ids WHERE name = 'Global Solutions'),
  'INV-2024-003',
  '2024-01-10',
  '2024-01-25',
  2000.00,
  200.00,
  2200.00,
  'overdue',
  'Consulting services - January'
ON CONFLICT (invoice_number) DO NOTHING;

-- Insert invoice items for the first invoice
WITH invoice_data AS (
  SELECT id FROM invoices WHERE invoice_number = 'INV-2024-001' LIMIT 1
)
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
SELECT 
  (SELECT id FROM invoice_data),
  'Homepage Design',
  1,
  2000.00,
  2000.00
UNION ALL
SELECT 
  (SELECT id FROM invoice_data),
  'Backend Development',
  40,
  50.00,
  2000.00
UNION ALL
SELECT 
  (SELECT id FROM invoice_data),
  'Testing & QA',
  20,
  50.00,
  1000.00;

-- Verify data
SELECT 'Clients created:' as info, COUNT(*) as count FROM clients WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Invoices created:', COUNT(*) FROM invoices WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Invoice items created:', COUNT(*) FROM invoice_items 
WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = 'YOUR_USER_ID');
