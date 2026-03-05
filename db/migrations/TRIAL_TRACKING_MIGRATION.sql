-- Migration: Add Trial Period Tracking to Subscriptions Table
-- Purpose: Track trial start/end dates and auto-renewal preference for Phase 20
-- Run this in Supabase SQL Editor

-- Add trial tracking columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Add index for trial_end_date to optimize queries for expiring trials
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end_date 
ON subscriptions(trial_end_date) 
WHERE status = 'trial';

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.trial_start_date IS 'Timestamp when the trial period started';
COMMENT ON COLUMN subscriptions.trial_end_date IS 'Timestamp when the trial period ends (14 days from start)';
COMMENT ON COLUMN subscriptions.auto_renew IS 'Whether subscription should auto-renew to paid plan after trial';

-- Update existing trial subscriptions to set trial dates (if any exist)
-- This assumes trials are 14 days from their start_date
UPDATE subscriptions
SET 
  trial_start_date = start_date::timestamp,
  trial_end_date = (start_date + INTERVAL '14 days')::timestamp,
  auto_renew = true
WHERE status = 'trial' 
  AND trial_start_date IS NULL;

-- Verification query (optional - shows trial subscriptions with dates)
-- SELECT id, user_id, status, trial_start_date, trial_end_date, auto_renew 
-- FROM subscriptions 
-- WHERE status = 'trial';
