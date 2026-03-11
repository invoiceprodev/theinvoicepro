function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredOneOf(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable. Set one of: ${names.join(", ")}`);
}

function envFlag(name: string) {
  const value = process.env[name];
  return value === "true" || value === "1";
}

export const apiConfig = {
  isDevelopment: process.env.NODE_ENV !== "production",
  port: Number(process.env.PORT || 3000),
  paymentProvider: (process.env.PAYMENT_PROVIDER || "paystack").toLowerCase(),
  auth0Domain: required("AUTH0_DOMAIN"),
  auth0Audience: required("AUTH0_AUDIENCE"),
  supabaseUrl: requiredOneOf("SUPABASE_URL", "VITE_SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  resendApiKey: process.env.RESEND_API_KEY || "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL || "noreply@theinvoicepro.co.za",
  customerAppUrl: process.env.CUSTOMER_APP_URL || "http://127.0.0.1:5173",
  adminAppUrl: process.env.ADMIN_APP_URL || "http://127.0.0.1:5173/admin",
  apiBaseUrl: process.env.API_BASE_URL || process.env.VITE_API_URL || `http://127.0.0.1:${Number(process.env.PORT || 3000)}`,
  payfastNotifyUrl: process.env.PAYFAST_NOTIFY_URL || "",
  payfastMerchantId: process.env.PAYFAST_MERCHANT_ID || "",
  payfastMerchantKey: process.env.PAYFAST_MERCHANT_KEY || "",
  payfastPassphrase: process.env.PAYFAST_PASSPHRASE || "",
  payfastMode: process.env.PAYFAST_MODE || "sandbox",
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
  paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "",
  paystackCallbackUrl: process.env.PAYSTACK_CALLBACK_URL || "",
  supabaseBrandingBucket: process.env.SUPABASE_BRANDING_BUCKET || "company-branding",
  trialBypassEnabled:
    (process.env.NODE_ENV !== "production") &&
    (envFlag("TRIAL_BYPASS_ENABLED") || envFlag("VITE_TRIAL_BYPASS_ENABLED")),
  adminAccessBypassEnabled:
    (process.env.NODE_ENV !== "production") &&
    (envFlag("ADMIN_ACCESS_BYPASS_ENABLED") || envFlag("VITE_ADMIN_ACCESS_BYPASS_ENABLED")),
};
