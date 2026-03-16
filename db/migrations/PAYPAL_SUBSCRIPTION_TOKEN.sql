ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS subscription_token TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_token
ON subscriptions(subscription_token)
WHERE subscription_token IS NOT NULL;

COMMENT ON COLUMN subscriptions.subscription_token IS 'Generic recurring billing token or provider subscription ID (used for PayPal subscriptions).';
