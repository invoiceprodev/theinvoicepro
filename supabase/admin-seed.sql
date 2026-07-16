-- Optional admin-facing seed data for demos and testing.

insert into public.profiles (id, full_name, business_name, business_email, company_name, is_admin)
values
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'InvoicePro Admin', 'admin@example.com', 'InvoicePro', true)
on conflict (id) do nothing;
