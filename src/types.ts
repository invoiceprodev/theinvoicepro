// Shared app types.
// The snake_case fields are canonical for Supabase-backed data.
// CamelCase aliases are kept for older dashboard pages that have not been fully migrated yet.

export type Currency = "ZAR" | "USD" | "EUR";

export const CURRENCIES: Array<{ value: Currency; label: string; symbol: string }> = [
  { value: "ZAR", label: "South African Rand", symbol: "R" },
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "EUR " },
];

export function getCurrencySymbol(currency?: string): string {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "EUR ";
    case "ZAR":
    default:
      return "R";
  }
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "pending" | "overdue";
export type LegacyInvoiceStatus = "Draft" | "Sent" | "Paid" | "Pending" | "Overdue";
export type AnyInvoiceStatus = InvoiceStatus | LegacyInvoiceStatus;

export function normalizeInvoiceStatus(status?: string | null): InvoiceStatus {
  switch ((status || "").toLowerCase()) {
    case "draft":
      return "draft";
    case "sent":
      return "sent";
    case "paid":
      return "paid";
    case "overdue":
      return "overdue";
    case "pending":
    default:
      return "pending";
  }
}

export function formatInvoiceStatus(status?: string | null): LegacyInvoiceStatus {
  switch (normalizeInvoiceStatus(status)) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
    case "pending":
    default:
      return "Pending";
  }
}

export type ClientStatus = "Active" | "Inactive" | "Suspended";

export function normalizeClientStatus(status?: string | null): ClientStatus {
  switch ((status || "").toLowerCase()) {
    case "suspended":
      return "Suspended";
    case "inactive":
      return "Inactive";
    case "active":
    default:
      return "Active";
  }
}

export type ExpenseCategory = "Pay Client" | "Pay Salary" | "Subscription" | "Operating Cost" | "Other";
export type ExpenseStatus = "Pending" | "Paid" | "Cancelled";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unit_price: number;
  unitPrice?: number;
  total: number;
  created_at: string;
  createdAt?: string;
}

export type LineItem = InvoiceItem;

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  status?: ClientStatus;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoiceNumber?: string;
  user_id: string;
  client_id: string;
  clientId?: string;
  client?: Client;
  invoice_date: string;
  invoiceDate?: string;
  due_date: string;
  dueDate?: string;
  status: AnyInvoiceStatus;
  currency?: Currency;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  total: number;
  discountType?: "percentage" | "fixed";
  discount?: number;
  notes?: string;
  items?: InvoiceItem[];
  lineItems?: InvoiceItem[];
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  user_id?: string;
  category: ExpenseCategory;
  recipient: string;
  recipient_email?: string;
  recipientEmail?: string;
  recipient_phone?: string;
  recipientPhone?: string;
  recipient_company?: string;
  recipientCompany?: string;
  amount: number;
  currency: Currency;
  payment_method?: "Bank Transfer" | "Cash" | "Card" | "EFT";
  paymentMethod?: "Bank Transfer" | "Cash" | "Card" | "EFT";
  date: string;
  status: ExpenseStatus;
  notes?: string;
  vat_applicable?: boolean;
  vatApplicable?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  features: string[];
  is_active: boolean;
  is_popular?: boolean;
  trial_days?: number;
  requires_card?: boolean;
  auto_renew?: boolean;
  created_at: string;
  updated_at: string;
  isPopular?: boolean;
  status?: "Active" | "Inactive";
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "trial" | "active" | "cancelled" | "expired";
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  payfast_token?: string;
  subscription_token?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  auto_renew?: boolean;
  created_at?: string;
  updated_at?: string;
  plan?: Plan;
  profile?: Pick<Profile, "id" | "full_name" | "business_email"> | null;
}

export type TeamMemberRole = "admin" | "member";
export type TeamMemberStatus = "invited" | "active";

export interface TeamMember {
  id: string;
  owner_profile_id: string;
  member_profile_id?: string | null;
  email: string;
  full_name?: string | null;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  invited_at?: string;
  created_at?: string;
  updated_at?: string;
  member_profile?: Pick<Profile, "id" | "full_name" | "business_email" | "company_name"> | null;
}

export type CurrentSubscriptionState =
  | "none"
  | "trial_pending"
  | "trial_active"
  | "active"
  | "cancelled"
  | "expired";

export function getCurrentSubscriptionState(subscription?: Subscription | null): CurrentSubscriptionState {
  if (!subscription) {
    return "none";
  }

  if (subscription.status === "trial") {
    const requiresCard = Boolean(subscription.plan?.requires_card);
    return subscription.payfast_token || !requiresCard ? "trial_active" : "trial_pending";
  }

  if (subscription.status === "active") {
    return "active";
  }

  if (subscription.status === "cancelled") {
    return "cancelled";
  }

  return "expired";
}

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
  old_plan?: Plan;
  new_plan?: Plan;
}

export interface Profile {
  id: string;
  auth0_user_id?: string;
  full_name?: string;
  role: "user" | "admin";
  account_status?: "active" | "suspended";
  avatar_url?: string;
  company_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  registration_number?: string;
  invoice_prefix?: string;
  currency?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type PaymentStatus = "pending" | "completed" | "failed";

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
  subscription?: Subscription;
  invoice?: Invoice;
  user?: Profile;
}

export interface PayFastWebhookPayload {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: "COMPLETE" | "FAILED" | "PENDING";
  item_name: string;
  item_description?: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  custom_int1?: string;
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
  raw_payload?: Record<string, unknown>;
  error_message?: string;
  processing_status?: "pending" | "processed" | "failed";
  invoice_id?: string;
  subscription_id?: string;
  payment_id?: string;
}

export type TrialConversionStatus = "active_trial" | "converted" | "cancelled" | "failed";

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
  user?: Profile;
  payment?: Payment;
  subscription?: Subscription;
}
