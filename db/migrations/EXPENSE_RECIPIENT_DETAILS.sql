-- ============================================================
-- Expense Recipient Details
-- ============================================================
-- Purpose:
-- Add structured recipient details to expenses so payout receipts
-- can include client/employee contact information.
--
-- Safe to re-run.

BEGIN;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS recipient_company TEXT;

COMMENT ON COLUMN expenses.recipient_email IS 'Email address used when sending an expense receipt';
COMMENT ON COLUMN expenses.recipient_phone IS 'Phone number for the payee or employee linked to the expense';
COMMENT ON COLUMN expenses.recipient_company IS 'Company or department associated with the expense recipient';

COMMIT;
