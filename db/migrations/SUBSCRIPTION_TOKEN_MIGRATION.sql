-- Migration: Add PayFast subscription token fields
-- Purpose: Enable PayFast recurring payment integration for auto-subscription
-- Execute this in Supabase SQL Editor

-- Add subscription token and trial tracking fields
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payfast_token TEXT,
ADD COLUMN IF NOT EXISTS trial_start_date DATE,
ADD COLUMN IF NOT EXISTS trial_end_date DATE,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Add index for token lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_payfast_token 
ON subscriptions(payfast_token) 
WHERE payfast_token IS NOT NULL;

-- Add index for trial tracking queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end 
ON subscriptions(trial_end_date) 
WHERE trial_end_date IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.payfast_token IS 'PayFast subscription token for recurring payments';
COMMENT ON COLUMN subscriptions.trial_start_date IS 'Trial period start date';
COMMENT ON COLUMN subscriptions.trial_end_date IS 'Trial period end date';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether subscription should auto-renew on trial end';
