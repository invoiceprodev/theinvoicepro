-- Business Settings Migration
-- Run this in Supabase SQL Editor to add business settings columns to profiles table

-- Add business settings columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS business_phone TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_currency ON profiles(currency);

-- Add comments for documentation
COMMENT ON COLUMN profiles.company_name IS 'Business/company name for invoicing';
COMMENT ON COLUMN profiles.business_email IS 'Business contact email';
COMMENT ON COLUMN profiles.business_phone IS 'Business contact phone';
COMMENT ON COLUMN profiles.business_address IS 'Business address for invoices';
COMMENT ON COLUMN profiles.currency IS 'Default currency for invoices (USD, ZAR, EUR, GBP, etc.)';
COMMENT ON COLUMN profiles.logo_url IS 'Business logo URL from Supabase Storage';
