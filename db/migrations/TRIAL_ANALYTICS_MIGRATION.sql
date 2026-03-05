-- Trial Conversions Tracking Table
-- Tracks trial-to-paid conversion status and analytics

-- Create trial_conversions table
CREATE TABLE IF NOT EXISTS trial_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trial_start_date TIMESTAMPTZ NOT NULL,
  trial_end_date TIMESTAMPTZ NOT NULL,
  conversion_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('active_trial', 'converted', 'cancelled', 'failed')),
  payment_id UUID REFERENCES payments(id),
  subscription_id UUID REFERENCES subscriptions(id),
  failure_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trial_conversions_user_id ON trial_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_status ON trial_conversions(status);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_trial_end_date ON trial_conversions(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_conversion_date ON trial_conversions(conversion_date);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_payment_id ON trial_conversions(payment_id);
CREATE INDEX IF NOT EXISTS idx_trial_conversions_subscription_id ON trial_conversions(subscription_id);

-- Composite index for upcoming expirations
CREATE INDEX IF NOT EXISTS idx_trial_conversions_status_trial_end ON trial_conversions(status, trial_end_date);

-- Add updated_at trigger
CREATE TRIGGER update_trial_conversions_updated_at
  BEFORE UPDATE ON trial_conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE trial_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all trial conversions
CREATE POLICY "Admins can view all trial conversions"
  ON trial_conversions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert trial conversions
CREATE POLICY "Admins can insert trial conversions"
  ON trial_conversions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update trial conversions
CREATE POLICY "Admins can update trial conversions"
  ON trial_conversions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own trial conversion
CREATE POLICY "Users can view their own trial conversion"
  ON trial_conversions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Comment on table
COMMENT ON TABLE trial_conversions IS 'Tracks trial-to-paid conversion status and analytics for admin dashboard';

-- Column comments
COMMENT ON COLUMN trial_conversions.status IS 'Conversion status: active_trial, converted, cancelled, failed';
COMMENT ON COLUMN trial_conversions.failure_reason IS 'Reason for failed conversion (e.g., payment declined, card expired)';
COMMENT ON COLUMN trial_conversions.trial_start_date IS 'When the trial period started';
COMMENT ON COLUMN trial_conversions.trial_end_date IS 'When the trial period ends/ended';
COMMENT ON COLUMN trial_conversions.conversion_date IS 'Date when trial was successfully converted to paid subscription';

-- Seed data for testing (optional - remove in production)
-- This creates sample trial conversion records for testing the analytics dashboard
INSERT INTO trial_conversions (user_id, trial_start_date, trial_end_date, status, conversion_date, notes)
SELECT 
  p.id,
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '4 days',
  'active_trial',
  NULL,
  'Sample active trial for testing'
FROM profiles p
WHERE p.role = 'user'
LIMIT 2;

INSERT INTO trial_conversions (user_id, trial_start_date, trial_end_date, status, conversion_date, notes)
SELECT 
  p.id,
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '6 days',
  'converted',
  NOW() - INTERVAL '6 days',
  'Sample converted trial for testing'
FROM profiles p
WHERE p.role = 'user'
LIMIT 3;

INSERT INTO trial_conversions (user_id, trial_start_date, trial_end_date, status, failure_reason, notes)
SELECT 
  p.id,
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '11 days',
  'failed',
  'Payment card declined',
  'Sample failed conversion for testing'
FROM profiles p
WHERE p.role = 'user'
LIMIT 1;
