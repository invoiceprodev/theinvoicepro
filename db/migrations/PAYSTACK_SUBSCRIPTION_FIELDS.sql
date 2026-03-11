-- Migration: Add Paystack subscription metadata fields
-- Purpose: Support Paystack redirect checkout and recurring authorization storage

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paystack_reference TEXT,
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_authorization_code TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_reference
ON subscriptions(paystack_reference)
WHERE paystack_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_paystack_authorization_code
ON subscriptions(paystack_authorization_code)
WHERE paystack_authorization_code IS NOT NULL;

COMMENT ON COLUMN subscriptions.paystack_reference IS 'Latest Paystack transaction reference for the subscription';
COMMENT ON COLUMN subscriptions.paystack_customer_code IS 'Paystack customer code for the subscription owner';
COMMENT ON COLUMN subscriptions.paystack_authorization_code IS 'Reusable Paystack authorization code for recurring charges';
