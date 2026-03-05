-- Migration: Add PayFast Token and Trial Period Fields to Subscriptions
-- Purpose: Enable card collection during trial signup and track trial periods
-- Execute this in Supabase SQL Editor

-- Add payfast_token column to subscriptions table for recurring billing
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payfast_token TEXT,
ADD COLUMN IF NOT EXISTS trial_start_date DATE,
ADD COLUMN IF NOT EXISTS trial_end_date DATE;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_payfast_token ON subscriptions(payfast_token);

-- Add comments for documentation
COMMENT ON COLUMN subscriptions.payfast_token IS 'PayFast subscription token for recurring billing';
COMMENT ON COLUMN subscriptions.trial_start_date IS 'Trial period start date';
COMMENT ON COLUMN subscriptions.trial_end_date IS 'Trial period end date (14 days from start)';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('payfast_token', 'trial_start_date', 'trial_end_date');
