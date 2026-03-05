// Database types matching Supabase schema

// Invoice line item type
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

// Invoice status type - matches database enum
export type InvoiceStatus = "draft" | "sent" | "paid" | "pending" | "overdue";

// Main Invoice type - matches database schema
export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  client_id: string;
  client?: Client;
  invoice_date: string;
  due_date: string;
  status: "draft" | "sent" | "paid" | "pending" | "overdue";
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  notes?: string;
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

// Client type - matches database schema
export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// Plan type - matches database schema
export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Frontend display properties (computed)
  isPopular?: boolean;
  status?: "Active" | "Inactive";
}

// Subscription type - matches database schema
export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "trial" | "active" | "cancelled" | "expired";
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  payfast_token?: string;
  subscription_token?: string; // PayFast subscription token for recurring payments
  trial_start_date?: string;
  trial_end_date?: string;
  auto_renew?: boolean;
  created_at?: string;
  updated_at?: string;
  // Relations (may be populated via joins)
  plan?: Plan;
}

// Subscription History type - matches database schema
export interface SubscriptionHistory {
  id: string;
  subscription_id: string;
  user_id: string;
  old_plan_id?: string;
  new_plan_id?: string;
  old_status?: string;
  new_status?: string;
  action_type: "created" | "plan_changed" | "status_changed" | "cancelled" | "upgraded" | "downgraded";
  changed_at: string;
  notes?: string;
  // Relations (may be populated via joins)
  old_plan?: Plan;
  new_plan?: Plan;
}

// User Profile type - matches database schema
export interface Profile {
  id: string;
  full_name?: string;
  role: "user" | "admin";
  account_status?: "active" | "suspended";
  avatar_url?: string;
  company_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  currency?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Payment status type - matches database enum
export type PaymentStatus = "pending" | "completed" | "failed";

// Payment type - matches database schema
export interface Payment {
  id: string;
  subscription_id?: string;
  invoice_id?: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: PaymentStatus;
  payfast_payment_id?: string;
  transaction_reference?: string;
  created_at: string;
  updated_at: string;
  // Relations (may be populated via joins)
  subscription?: Subscription;
  invoice?: Invoice;
  user?: Profile;
}

// PayFast webhook payload type
export interface PayFastWebhookPayload {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: "COMPLETE" | "FAILED" | "PENDING";
  item_name: string;
  item_description?: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string; // user_id
  custom_str2?: string; // payment_type (invoice or subscription)
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  custom_int1?: string; // invoice_id or subscription_id
  custom_int2?: string;
  custom_int3?: string;
  custom_int4?: string;
  custom_int5?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  merchant_id: string;
  signature: string;
}

// Webhook log type - matches database schema
export interface WebhookLog {
  id: string;
  created_at: string;
  pf_payment_id?: string;
  merchant_id?: string;
  merchant_key?: string;
  m_payment_id?: string;
  amount_gross?: number;
  amount_fee?: number;
  amount_net?: number;
  custom_str1?: string;
  custom_int1?: number;
  payment_status?: string;
  signature_verified?: boolean;
  raw_payload?: Record<string, any>;
  error_message?: string;
  processing_status?: "pending" | "processed" | "failed";
  invoice_id?: string;
  subscription_id?: string;
  payment_id?: string;
}

// Trial conversion status type
export type TrialConversionStatus = "active_trial" | "converted" | "cancelled" | "failed";

// Trial Conversion type - matches database schema
export interface TrialConversion {
  id: string;
  user_id: string;
  trial_start_date: string;
  trial_end_date: string;
  conversion_date?: string;
  status: TrialConversionStatus;
  payment_id?: string;
  subscription_id?: string;
  failure_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations (may be populated via joins)
  user?: Profile;
  payment?: Payment;
  subscription?: Subscription;
}
