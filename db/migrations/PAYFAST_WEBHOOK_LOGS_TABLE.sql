-- PayFast Webhook Logs Table
-- This table stores all webhook events received from PayFast for auditing and debugging
-- Run this SQL in your Supabase SQL Editor to create the webhook logs table

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Webhook data
  pf_payment_id TEXT,
  merchant_id TEXT,
  merchant_key TEXT,
  m_payment_id TEXT,
  amount_gross DECIMAL(10, 2),
  amount_fee DECIMAL(10, 2),
  amount_net DECIMAL(10, 2),
  
  -- Custom fields
  custom_str1 TEXT, -- user_id
  custom_int1 INTEGER, -- invoice_id or subscription_id
  
  -- Status
  payment_status TEXT, -- COMPLETE, FAILED, PENDING
  
  -- Metadata
  signature_verified BOOLEAN DEFAULT false,
  raw_payload JSONB,
  error_message TEXT,
  processing_status TEXT DEFAULT 'pending', -- pending, processed, failed
  
  -- Reference IDs
  invoice_id INTEGER REFERENCES invoices(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  payment_id INTEGER REFERENCES payments(id),
  
  -- Indexes for faster lookups
  CONSTRAINT webhook_logs_pf_payment_id_key UNIQUE (pf_payment_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_pf_payment_id ON webhook_logs(pf_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_invoice_id ON webhook_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_subscription_id ON webhook_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_status ON webhook_logs(payment_status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processing_status ON webhook_logs(processing_status);

-- Enable Row Level Security
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admin users can view all webhook logs
CREATE POLICY "Admins can view all webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Users can view their own webhook logs (via invoice or subscription)
CREATE POLICY "Users can view their own webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    custom_str1 = auth.uid()::text
    OR
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
    OR
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = auth.uid()
    )
  );

-- System can insert webhook logs (service role bypasses RLS)
CREATE POLICY "System can insert webhook logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE webhook_logs IS 'Stores all PayFast webhook events for auditing and debugging';

-- Grant permissions
GRANT SELECT, INSERT ON webhook_logs TO authenticated;
GRANT ALL ON webhook_logs TO service_role;
