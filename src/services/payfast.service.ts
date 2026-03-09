import CryptoJS from "crypto-js";
import type { Invoice, Profile } from "@/types";

// PayFast configuration
const PAYFAST_CONFIG = {
  merchantId: import.meta.env.VITE_PAYFAST_MERCHANT_ID || "",
  merchantKey: import.meta.env.VITE_PAYFAST_MERCHANT_KEY || "",
  passphrase: import.meta.env.VITE_PAYFAST_PASSPHRASE || "",
  mode: import.meta.env.VITE_PAYFAST_MODE || "sandbox", // 'sandbox' or 'live'
};

// PayFast URLs
const PAYFAST_URLS = {
  sandbox: "https://sandbox.payfast.co.za/eng/process",
  live: "https://www.payfast.co.za/eng/process",
};

export interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first?: string;
  name_last?: string;
  email_address: string;
  cell_number?: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_str1?: string; // Can store invoice_id
  custom_str2?: string; // Can store user_id
  custom_int1?: number;
  email_confirmation?: number;
  confirmation_address?: string;
  payment_method?: string;
  signature?: string;
}

export interface PayFastInvoicePaymentParams {
  invoice: Invoice;
  businessProfile?: Profile;
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
}

// Add subscription payment params interface
export interface PayFastSubscriptionPaymentParams {
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    billing_cycle: string;
  };
  profile: {
    id: string;
    full_name?: string;
    business_email?: string;
    business_phone?: string;
  };
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
}

/**
 * Check if PayFast is configured
 */
export const isPayFastConfigured = (): boolean => {
  return !!(PAYFAST_CONFIG.merchantId && PAYFAST_CONFIG.merchantKey && PAYFAST_CONFIG.passphrase);
};

/**
 * Get PayFast configuration status
 */
export const getPayFastStatus = (): {
  configured: boolean;
  mode: string;
  message: string;
} => {
  const configured = isPayFastConfigured();

  if (configured) {
    return {
      configured: true,
      mode: PAYFAST_CONFIG.mode,
      message: `PayFast is configured in ${PAYFAST_CONFIG.mode} mode.`,
    };
  }

  return {
    configured: false,
    mode: PAYFAST_CONFIG.mode,
    message:
      "PayFast is not configured. Please add PayFast credentials to your .env file. See PAYFAST_SETUP.md for instructions.",
  };
};

/**
 * Generate MD5 signature for PayFast payment
 */
const generateSignature = (data: Record<string, string | number>): string => {
  // Create parameter string
  const pfParamString = Object.keys(data)
    .filter((key) => key !== "signature") // Exclude signature field
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key].toString().trim())}`)
    .join("&");

  // Append passphrase if in non-sandbox mode or if passphrase is set
  const signatureString = PAYFAST_CONFIG.passphrase
    ? `${pfParamString}&passphrase=${encodeURIComponent(PAYFAST_CONFIG.passphrase)}`
    : pfParamString;

  // Generate MD5 hash
  return CryptoJS.MD5(signatureString).toString();
};

/**
 * Generate PayFast payment data for an invoice
 */
export const generateInvoicePaymentData = ({
  invoice,
  businessProfile,
  returnUrl,
  cancelUrl,
  notifyUrl,
}: PayFastInvoicePaymentParams): PayFastPaymentData => {
  if (!isPayFastConfigured()) {
    throw new Error("PayFast is not configured. Please set up your PayFast credentials.");
  }

  if (!invoice.client) {
    throw new Error("Invoice must have client information to generate payment.");
  }

  // Default URLs (should be replaced with actual app URLs)
  const baseUrl = window.location.origin;
  const defaultReturnUrl = `${baseUrl}/dashboard/invoices/show/${invoice.id}?payment=success`;
  const defaultCancelUrl = `${baseUrl}/dashboard/invoices/show/${invoice.id}?payment=cancelled`;
  const defaultNotifyUrl = `${baseUrl}/api/payfast/notify`; // Webhook endpoint

  // Split client name into first and last name
  const nameParts = invoice.client.name.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  // Prepare payment data
  const paymentData: Record<string, string | number> = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: returnUrl || defaultReturnUrl,
    cancel_url: cancelUrl || defaultCancelUrl,
    notify_url: notifyUrl || defaultNotifyUrl,
    name_first: firstName,
    name_last: lastName,
    email_address: invoice.client.email,
    m_payment_id: invoice.id, // Unique payment ID (invoice ID)
    amount: invoice.total.toFixed(2),
    item_name: `Invoice ${invoice.invoice_number}`,
    item_description: `Payment for invoice ${invoice.invoice_number}`,
    custom_str1: invoice.id, // Store invoice ID for reference
    custom_str2: invoice.user_id, // Store user ID for reference
    custom_int1: 0, // Flag: 0 = invoice payment, 1 = subscription payment
    email_confirmation: 1,
    confirmation_address: businessProfile?.business_email || invoice.client.email,
  };

  // Add cell number if available
  if (invoice.client.phone) {
    paymentData.cell_number = invoice.client.phone.replace(/\D/g, ""); // Remove non-digits
  }

  // Generate signature
  const signature = generateSignature(paymentData);

  return {
    ...paymentData,
    signature,
  } as PayFastPaymentData;
};

/**
 * Get PayFast payment URL
 */
export const getPayFastUrl = (): string => {
  return PAYFAST_CONFIG.mode === "live" ? PAYFAST_URLS.live : PAYFAST_URLS.sandbox;
};

/**
 * Generate PayFast payment link for an invoice
 */
export const generateInvoicePaymentLink = (params: PayFastInvoicePaymentParams): string => {
  const paymentData = generateInvoicePaymentData(params);
  const payFastUrl = getPayFastUrl();

  // Build query string
  const queryString = Object.keys(paymentData)
    .map((key) => `${key}=${encodeURIComponent(paymentData[key as keyof PayFastPaymentData]?.toString() || "")}`)
    .join("&");

  return `${payFastUrl}?${queryString}`;
};

/**
 * Redirect to PayFast payment page
 */
export const redirectToPayFast = (params: PayFastInvoicePaymentParams): void => {
  const paymentLink = generateInvoicePaymentLink(params);
  window.location.href = paymentLink;
};

/**
 * Create HTML form for PayFast payment (POST method - recommended)
 */
export const createPayFastForm = (params: PayFastInvoicePaymentParams): HTMLFormElement => {
  const paymentData = generateInvoicePaymentData(params);
  const payFastUrl = getPayFastUrl();

  // Create form element
  const form = document.createElement("form");
  form.method = "POST";
  form.action = payFastUrl;
  form.style.display = "none";

  // Add input fields
  Object.keys(paymentData).forEach((key) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = paymentData[key as keyof PayFastPaymentData]?.toString() || "";
    form.appendChild(input);
  });

  return form;
};

/**
 * Submit PayFast payment form (POST method - recommended)
 */
export const submitPayFastPayment = (params: PayFastInvoicePaymentParams): void => {
  const form = createPayFastForm(params);
  document.body.appendChild(form);
  form.submit();
};

/**
 * Generate PayFast payment data for a subscription
 */
export const generateSubscriptionPaymentData = ({
  subscription,
  plan,
  profile,
  returnUrl,
  cancelUrl,
  notifyUrl,
}: PayFastSubscriptionPaymentParams): PayFastPaymentData => {
  if (!isPayFastConfigured()) {
    throw new Error("PayFast is not configured. Please set up your PayFast credentials.");
  }

  // Default URLs
  const baseUrl = window.location.origin;
  const defaultReturnUrl = `${baseUrl}/dashboard/plans?payment=success`;
  const defaultCancelUrl = `${baseUrl}/dashboard/plans?payment=cancelled`;
  const defaultNotifyUrl = `${baseUrl}/api/payfast/notify`;

  // Split profile name into first and last name
  const fullName = profile.full_name || "Customer";
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  // Prepare payment data
  const paymentData: Record<string, string | number> = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: returnUrl || defaultReturnUrl,
    cancel_url: cancelUrl || defaultCancelUrl,
    notify_url: notifyUrl || defaultNotifyUrl,
    name_first: firstName,
    name_last: lastName,
    email_address: profile.business_email || "",
    m_payment_id: `SUB-${subscription.id}`, // Unique payment ID for subscription
    amount: plan.price.toFixed(2),
    item_name: `${plan.name} Plan Subscription`,
    item_description: `${plan.billing_cycle} subscription to ${plan.name} plan`,
    custom_str1: subscription.id, // Store subscription ID
    custom_str2: subscription.user_id, // Store user ID
    custom_int1: 1, // Flag: 1 = subscription payment, 0 = invoice payment
    email_confirmation: 1,
    confirmation_address: profile.business_email || "",
  };

  // Add cell number if available
  if (profile.business_phone) {
    paymentData.cell_number = profile.business_phone.replace(/\D/g, "");
  }

  // Generate signature
  const signature = generateSignature(paymentData);

  return {
    ...paymentData,
    signature,
  } as PayFastPaymentData;
};

/**
 * Generate PayFast payment link for a subscription
 */
export const generateSubscriptionPaymentLink = (params: PayFastSubscriptionPaymentParams): string => {
  const paymentData = generateSubscriptionPaymentData(params);
  const payFastUrl = getPayFastUrl();

  // Build query string
  const queryString = Object.keys(paymentData)
    .map((key) => `${key}=${encodeURIComponent(paymentData[key as keyof PayFastPaymentData]?.toString() || "")}`)
    .join("&");

  return `${payFastUrl}?${queryString}`;
};

/**
 * Open PayFast payment in new window for subscription
 */
export const openSubscriptionPayment = (params: PayFastSubscriptionPaymentParams): Window | null => {
  const paymentLink = generateSubscriptionPaymentLink(params);
  return window.open(paymentLink, "_blank", "width=800,height=600,scrollbars=yes");
};

/**
 * Verify PayFast webhook signature
 */
export const verifyPayFastSignature = (
  postData: Record<string, string | number>,
  receivedSignature: string,
): boolean => {
  // Remove signature from data
  const { signature, ...dataToVerify } = postData;

  // Generate expected signature
  const expectedSignature = generateSignature(dataToVerify);

  // Compare signatures
  return expectedSignature === receivedSignature;
};

/**
 * Parse PayFast webhook data
 */
export interface PayFastWebhookData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string; // invoice_id
  custom_str2?: string; // user_id
  custom_int1?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  merchant_id: string;
  signature: string;
}

/**
 * Process PayFast webhook notification
 */
export const processPayFastWebhook = async (
  webhookData: PayFastWebhookData,
): Promise<{
  success: boolean;
  invoiceId?: string;
  paymentStatus?: string;
  error?: string;
}> => {
  try {
    // Verify signature
    const isValid = verifyPayFastSignature(
      webhookData as unknown as Record<string, string | number>,
      webhookData.signature,
    );

    if (!isValid) {
      return {
        success: false,
        error: "Invalid signature",
      };
    }

    // Extract invoice ID from custom field
    const invoiceId = webhookData.custom_str1 || webhookData.m_payment_id;

    // Return payment data for processing
    return {
      success: true,
      invoiceId,
      paymentStatus: webhookData.payment_status,
    };
  } catch (error) {
    console.error("Error processing PayFast webhook:", error);
    return {
      success: false,
      error: "Failed to process webhook",
    };
  }
};

export default {
  isPayFastConfigured,
  getPayFastStatus,
  generateInvoicePaymentData,
  generateInvoicePaymentLink,
  generateSubscriptionPaymentData,
  generateSubscriptionPaymentLink,
  openSubscriptionPayment,
  redirectToPayFast,
  submitPayFastPayment,
  createPayFastForm,
  verifyPayFastSignature,
  processPayFastWebhook,
};

/**
 * Create subscription payment for trial card collection
 * This sets up a recurring subscription that will charge after trial period
 */
export async function createTrialSubscription(params: {
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  subscriptionId: string;
  planName?: string;
  trialDays?: number;
  billingCycle?: "monthly" | "yearly";
}): Promise<{
  url: string;
  merchantId: string;
  signature: string;
  debug: {
    mode: string;
    payfastUrl: string;
    merchantId: string;
    returnUrl: string;
    cancelUrl: string;
    notifyUrl: string;
    amount: string;
    itemName: string;
    itemDescription: string;
    billingDate: string;
    frequency: string;
    cycles: string;
    subscriptionType: string;
    emailAddress: string;
    customUserId: string;
    customSubscriptionId: string;
    signaturePresent: boolean;
  };
}> {
  const {
    userId,
    userEmail,
    userName,
    amount,
    subscriptionId,
    planName = "InvoicePro Trial Subscription",
    trialDays = 14,
    billingCycle = "monthly",
  } = params;

  const merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID;
  const merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY;
  const mode = import.meta.env.VITE_PAYFAST_MODE || "sandbox";

  if (!merchantId || !merchantKey) {
    throw new Error("PayFast credentials not configured");
  }

  // Generate unique merchant payment ID
  const merchantPaymentId = `TRIAL_${userId}_${Date.now()}`;

  // Build payment data for subscription
  const returnUrl = `${window.location.origin}/auth/card-setup/success?user_id=${userId}&subscription_id=${subscriptionId}`;
  const cancelUrl = `${window.location.origin}/auth/card-setup?user_id=${userId}&email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(userName)}&error=cancelled`;
  const notifyUrl = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || window.location.origin}/payfast/webhook`;
  const billingDate = getTrialEndDate(trialDays);

  const paymentData = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,

    // Payer details
    name_first: userName.split(" ")[0] || userName,
    name_last: userName.split(" ").slice(1).join(" ") || "",
    email_address: userEmail,

    // Transaction details
    m_payment_id: merchantPaymentId,
    amount: amount.toFixed(2),
    item_name: planName,
    item_description:
      trialDays > 0
        ? `${trialDays}-day free trial, then R${amount}/${billingCycle === "yearly" ? "year" : "month"}`
        : `${planName} recurring subscription`,

    // Subscription specific fields
    subscription_type: "1", // Subscription
    billing_date: billingDate,
    recurring_amount: amount.toFixed(2),
    frequency: billingCycle === "yearly" ? "6" : "3",
    cycles: "0", // Unlimited cycles

    // Custom fields
    custom_str1: userId,
    custom_str2: subscriptionId,
    custom_str3: "trial_subscription",
  };

  // Generate signature using the shared generateSignature function
  const signature = generateSignature(paymentData);

  // Build PayFast URL with query parameters
  const payfastUrl = mode === "live" ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process";

  const queryString = new URLSearchParams({
    ...paymentData,
    signature,
  }).toString();

  return {
    url: `${payfastUrl}?${queryString}`,
    merchantId,
    signature,
    debug: {
      mode,
      payfastUrl,
      merchantId,
      returnUrl,
      cancelUrl,
      notifyUrl,
      amount: paymentData.amount,
      itemName: paymentData.item_name,
      itemDescription: paymentData.item_description,
      billingDate,
      frequency: paymentData.frequency,
      cycles: paymentData.cycles,
      subscriptionType: paymentData.subscription_type,
      emailAddress: paymentData.email_address,
      customUserId: paymentData.custom_str1,
      customSubscriptionId: paymentData.custom_str2,
      signaturePresent: Boolean(signature),
    },
  };
}

/**
 * Get trial end date (14 days from now) in PayFast format
 */
function getTrialEndDate(trialDays = 14): string {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);

  // Format: YYYY-MM-DD
  return trialEndDate.toISOString().split("T")[0];
}

/**
 * PayFast Service
 * Handles PayFast payment gateway integration
 */
export class PayFastService {
  private merchantId: string;
  private merchantKey: string;
  private passphrase: string;
  private mode: string;
  private payfastUrl: string;
  private notifyUrl: string;

  constructor() {
    this.merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID || "";
    this.merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY || "";
    this.passphrase = import.meta.env.VITE_PAYFAST_PASSPHRASE || "";
    this.mode = import.meta.env.VITE_PAYFAST_MODE || "sandbox";
    this.payfastUrl = this.mode === "live" ? PAYFAST_URLS.live : PAYFAST_URLS.sandbox;
    this.notifyUrl = `${window.location.origin}/api/payfast/notify`;
  }

  /**
   * Generate MD5 signature for PayFast payment
   */
  private generateSignature(data: Record<string, string | number>): string {
    // Create parameter string
    const pfParamString = Object.keys(data)
      .filter((key) => key !== "signature") // Exclude signature field
      .sort()
      .map((key) => `${key}=${encodeURIComponent(data[key].toString().trim())}`)
      .join("&");

    // Append passphrase if set
    const signatureString = this.passphrase
      ? `${pfParamString}&passphrase=${encodeURIComponent(this.passphrase)}`
      : pfParamString;

    // Generate MD5 hash
    return CryptoJS.MD5(signatureString).toString();
  }

  /**
   * Create subscription for recurring payments
   * @param subscriptionData Subscription details including user, plan, and payment info
   * @returns PayFast subscription form URL and token
   */
  async createSubscription(subscriptionData: {
    userId: string;
    subscriptionId: string;
    planName: string;
    amount: number;
    frequency: 3 | 6; // 3 = monthly, 6 = annual
    cycles: number; // 0 = infinite
    userEmail: string;
    userName: string;
  }): Promise<{ formUrl: string; token: string }> {
    const { userId, subscriptionId, planName, amount, frequency, cycles, userEmail, userName } = subscriptionData;

    // Generate subscription token (unique identifier)
    const token = `sub_${subscriptionId}_${Date.now()}`;

    // Build subscription payload
    const payload: Record<string, string> = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: `${window.location.origin}/dashboard/plans?subscription_success=true`,
      cancel_url: `${window.location.origin}/dashboard/plans?subscription_cancelled=true`,
      notify_url: this.notifyUrl,

      // Subscription specific fields
      subscription_type: "1", // 1 = subscription
      billing_date: new Date().toISOString().split("T")[0], // Start date (YYYY-MM-DD)
      recurring_amount: amount.toFixed(2),
      frequency: frequency.toString(), // 3 = monthly, 6 = annual
      cycles: cycles.toString(), // 0 = infinite, or specific number

      // Order details
      item_name: `${planName} Subscription`,
      item_description: `Recurring subscription for ${planName}`,
      amount: amount.toFixed(2),

      // Custom fields for tracking
      custom_str1: userId,
      custom_str2: "subscription",
      custom_str3: token,
      custom_int1: subscriptionId,

      // User details
      email_address: userEmail,
      name_first: userName.split(" ")[0] || userName,
      name_last: userName.split(" ").slice(1).join(" ") || "",
    };

    // Generate signature
    payload.signature = this.generateSignature(payload);

    // Build form URL with query parameters
    const queryString = new URLSearchParams(payload).toString();
    const formUrl = `${this.payfastUrl}/eng/process?${queryString}`;

    return { formUrl, token };
  }

  /**
   * Charge a stored card using subscription token
   * @param chargeData Token and amount details
   * @returns Payment result
   */
  async chargeStoredCard(chargeData: {
    token: string;
    amount: number;
    itemName: string;
    itemDescription?: string;
  }): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    const { token, amount, itemName, itemDescription } = chargeData;

    try {
      // PayFast ad hoc payment endpoint (requires token from subscription)
      const adhocUrl = `${this.payfastUrl}/eng/query/adhoc`;

      const payload = {
        merchant_id: this.merchantId,
        version: "v1",
        timestamp: new Date().toISOString(),
        signature: "", // Will be generated below
        token: token,
        amount: amount.toFixed(2),
        item_name: itemName,
        item_description: itemDescription || itemName,
      };

      // Generate signature for ad hoc payment
      payload.signature = this.generateSignature(payload);

      // Make API call to PayFast
      const response = await fetch(adhocUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "merchant-id": this.merchantId,
          version: "v1",
          timestamp: payload.timestamp,
          signature: payload.signature,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`PayFast API error: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: result.status === "success",
        paymentId: result.data?.pf_payment_id,
        error: result.status !== "success" ? result.message : undefined,
      };
    } catch (error) {
      console.error("Error charging stored card:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cancel a subscription
   * @param token PayFast subscription token
   * @returns Cancellation result
   */
  async cancelSubscription(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // PayFast subscription cancel endpoint
      const cancelUrl = `${this.payfastUrl}/eng/query/cancel`;

      const payload = {
        merchant_id: this.merchantId,
        version: "v1",
        timestamp: new Date().toISOString(),
        signature: "", // Will be generated below
        token: token,
      };

      // Generate signature
      payload.signature = this.generateSignature(payload);

      // Make API call to PayFast
      const response = await fetch(cancelUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "merchant-id": this.merchantId,
          version: "v1",
          timestamp: payload.timestamp,
          signature: payload.signature,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`PayFast API error: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: result.status === "success",
        error: result.status !== "success" ? result.message : undefined,
      };
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
