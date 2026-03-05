import { supabaseClient } from "@/lib/supabase";
import type { Payment, Invoice, Subscription } from "@/types";
import CryptoJS from "crypto-js";

/**
 * PayFast ITN (Instant Transaction Notification) Webhook Handler Service
 * Processes webhook notifications from PayFast payment gateway
 */

export interface PayFastWebhookPayload {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: "COMPLETE" | "FAILED" | "PENDING";
  item_name: string;
  item_description?: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string; // invoice_id or subscription_id
  custom_str2?: string; // user_id
  custom_int1?: string; // 1 = subscription, 0 = invoice
  name_first?: string;
  name_last?: string;
  email_address?: string;
  merchant_id: string;
  signature: string;
  // Subscription specific fields
  token?: string; // PayFast subscription token for recurring payments
  billing_date?: string; // Next billing date
}

export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  paymentId?: string;
  invoiceId?: string;
  subscriptionId?: string;
  error?: string;
}

/**
 * Verify PayFast webhook signature
 */
export const verifyWebhookSignature = (
  postData: Record<string, string | number>,
  receivedSignature: string,
  passphrase?: string,
): boolean => {
  try {
    // Remove signature from data for verification
    const { signature, ...dataToVerify } = postData;

    // Create parameter string (sorted by key)
    const pfParamString = Object.keys(dataToVerify)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(dataToVerify[key].toString().trim())}`)
      .join("&");

    // Append passphrase if provided
    const signatureString = passphrase
      ? `${pfParamString}&passphrase=${encodeURIComponent(passphrase)}`
      : pfParamString;

    // Generate MD5 hash
    const expectedSignature = CryptoJS.MD5(signatureString).toString();

    // Compare signatures
    return expectedSignature === receivedSignature;
  } catch (error) {
    console.error("[PayFast Webhook] Signature verification error:", error);
    return false;
  }
};

/**
 * Validate webhook data format
 */
export const validateWebhookData = (data: PayFastWebhookPayload): boolean => {
  // Check required fields
  if (!data.m_payment_id || !data.pf_payment_id || !data.payment_status) {
    console.error("[PayFast Webhook] Missing required fields");
    return false;
  }

  // Validate payment status
  if (!["COMPLETE", "FAILED", "PENDING"].includes(data.payment_status)) {
    console.error("[PayFast Webhook] Invalid payment status:", data.payment_status);
    return false;
  }

  // Validate amount
  if (!data.amount_gross || isNaN(parseFloat(data.amount_gross))) {
    console.error("[PayFast Webhook] Invalid amount:", data.amount_gross);
    return false;
  }

  return true;
};

/**
 * Create payment record in database
 */
export const createPaymentRecord = async (webhookData: PayFastWebhookPayload): Promise<Payment | null> => {
  try {
    const isSubscriptionPayment = webhookData.custom_int1 === "1";
    const referenceId = webhookData.custom_str1; // invoice_id or subscription_id
    const userId = webhookData.custom_str2;

    if (!userId) {
      console.error("[PayFast Webhook] Missing user_id");
      return null;
    }

    // Map PayFast status to our payment status
    let paymentStatus: "pending" | "completed" | "failed" = "pending";
    if (webhookData.payment_status === "COMPLETE") {
      paymentStatus = "completed";
    } else if (webhookData.payment_status === "FAILED") {
      paymentStatus = "failed";
    }

    // Prepare payment data
    const paymentData: Partial<Payment> = {
      user_id: userId,
      amount: parseFloat(webhookData.amount_gross),
      currency: "ZAR",
      payment_method: "payfast",
      status: paymentStatus,
      payfast_payment_id: webhookData.pf_payment_id,
      transaction_reference: webhookData.m_payment_id,
    };

    // Add reference to invoice or subscription
    if (isSubscriptionPayment) {
      paymentData.subscription_id = referenceId;
    } else {
      paymentData.invoice_id = referenceId;
    }

    // Insert payment record
    const { data, error } = await supabaseClient.from("payments").insert(paymentData).select().single();

    if (error) {
      console.error("[PayFast Webhook] Error creating payment record:", error);
      return null;
    }

    console.log("[PayFast Webhook] Payment record created:", data.id);
    return data as Payment;
  } catch (error) {
    console.error("[PayFast Webhook] Error in createPaymentRecord:", error);
    return null;
  }
};

/**
 * Update invoice status on successful payment
 */
export const updateInvoiceStatus = async (invoiceId: string): Promise<boolean> => {
  try {
    const { error } = await supabaseClient
      .from("invoices")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", invoiceId);

    if (error) {
      console.error("[PayFast Webhook] Error updating invoice status:", error);
      return false;
    }

    console.log("[PayFast Webhook] Invoice status updated to paid:", invoiceId);
    return true;
  } catch (error) {
    console.error("[PayFast Webhook] Error in updateInvoiceStatus:", error);
    return false;
  }
};

/**
 * Update subscription status on successful payment
 */
export const updateSubscriptionStatus = async (
  subscriptionId: string,
  subscriptionToken?: string,
): Promise<boolean> => {
  try {
    // Calculate new renewal date (30 days from now for monthly)
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);

    const updateData: Record<string, any> = {
      status: "active",
      renewal_date: renewalDate.toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store subscription token if provided (for recurring payments)
    if (subscriptionToken) {
      updateData.subscription_token = subscriptionToken;
    }

    const { error } = await supabaseClient.from("subscriptions").update(updateData).eq("id", subscriptionId);

    if (error) {
      console.error("[PayFast Webhook] Error updating subscription status:", error);
      return false;
    }

    console.log("[PayFast Webhook] Subscription status updated to active:", subscriptionId);
    if (subscriptionToken) {
      console.log("[PayFast Webhook] Subscription token stored:", subscriptionToken);
    }
    return true;
  } catch (error) {
    console.error("[PayFast Webhook] Error in updateSubscriptionStatus:", error);
    return false;
  }
};

/**
 * Log webhook event for debugging and audit trail
 */
export const logWebhookEvent = async (
  webhookData: PayFastWebhookPayload,
  result: WebhookProcessingResult,
): Promise<void> => {
  try {
    // You can store webhook logs in a separate table or use console logging
    // For now, we'll use console logging with structured data
    console.log("[PayFast Webhook] Event Log:", {
      timestamp: new Date().toISOString(),
      payfast_payment_id: webhookData.pf_payment_id,
      m_payment_id: webhookData.m_payment_id,
      payment_status: webhookData.payment_status,
      amount: webhookData.amount_gross,
      custom_str1: webhookData.custom_str1,
      custom_str2: webhookData.custom_str2,
      result: result.success ? "success" : "failure",
      message: result.message,
      error: result.error || null,
    });

    // Optional: Store in a webhook_logs table if you want persistent logs
    // await supabaseClient.from("webhook_logs").insert({
    //   provider: "payfast",
    //   event_type: "payment_notification",
    //   payload: webhookData,
    //   result: result,
    //   created_at: new Date().toISOString(),
    // });
  } catch (error) {
    console.error("[PayFast Webhook] Error logging webhook event:", error);
  }
};

/**
 * Main webhook processing function
 * Call this from your webhook endpoint (e.g., Netlify Function)
 */
export const processWebhook = async (
  webhookData: PayFastWebhookPayload,
  passphrase?: string,
): Promise<WebhookProcessingResult> => {
  console.log("[PayFast Webhook] Processing webhook notification");

  // Step 1: Validate webhook data format
  if (!validateWebhookData(webhookData)) {
    const result: WebhookProcessingResult = {
      success: false,
      message: "Invalid webhook data format",
      error: "Missing required fields or invalid data",
    };
    await logWebhookEvent(webhookData, result);
    return result;
  }

  // Step 2: Verify signature
  const isValidSignature = verifyWebhookSignature(
    webhookData as unknown as Record<string, string | number>,
    webhookData.signature,
    passphrase,
  );

  if (!isValidSignature) {
    const result: WebhookProcessingResult = {
      success: false,
      message: "Invalid signature",
      error: "Signature verification failed",
    };
    await logWebhookEvent(webhookData, result);
    return result;
  }

  console.log("[PayFast Webhook] Signature verified successfully");

  // Step 3: Create payment record
  const payment = await createPaymentRecord(webhookData);

  if (!payment) {
    const result: WebhookProcessingResult = {
      success: false,
      message: "Failed to create payment record",
      error: "Database error",
    };
    await logWebhookEvent(webhookData, result);
    return result;
  }

  // Step 4: Process payment based on status
  if (webhookData.payment_status === "COMPLETE") {
    const isSubscriptionPayment = webhookData.custom_int1 === "1";

    if (isSubscriptionPayment && payment.subscription_id) {
      // Update subscription status and store token for recurring payments
      const subscriptionUpdated = await updateSubscriptionStatus(payment.subscription_id, webhookData.token);

      const result: WebhookProcessingResult = {
        success: subscriptionUpdated,
        message: subscriptionUpdated
          ? "Subscription payment processed successfully"
          : "Failed to update subscription status",
        paymentId: payment.id,
        subscriptionId: payment.subscription_id,
        error: subscriptionUpdated ? undefined : "Subscription update failed",
      };
      await logWebhookEvent(webhookData, result);
      return result;
    } else if (payment.invoice_id) {
      // Update invoice status
      const invoiceUpdated = await updateInvoiceStatus(payment.invoice_id);

      const result: WebhookProcessingResult = {
        success: invoiceUpdated,
        message: invoiceUpdated ? "Invoice payment processed successfully" : "Failed to update invoice status",
        paymentId: payment.id,
        invoiceId: payment.invoice_id,
        error: invoiceUpdated ? undefined : "Invoice update failed",
      };
      await logWebhookEvent(webhookData, result);
      return result;
    }
  } else if (webhookData.payment_status === "FAILED") {
    const result: WebhookProcessingResult = {
      success: true,
      message: "Payment failed - recorded in database",
      paymentId: payment.id,
    };
    await logWebhookEvent(webhookData, result);
    return result;
  }

  // Default success case
  const result: WebhookProcessingResult = {
    success: true,
    message: "Webhook processed successfully",
    paymentId: payment.id,
  };
  await logWebhookEvent(webhookData, result);
  return result;
};

/**
 * Verify webhook is from PayFast servers (optional additional security)
 * Check if request comes from valid PayFast IP addresses
 */
export const verifyPayFastIP = (ipAddress: string): boolean => {
  // PayFast server IP addresses
  const validIPs = [
    "197.97.145.144",
    "41.74.179.194",
    // Add more PayFast IPs as needed
  ];

  return validIPs.includes(ipAddress);
};

export default {
  processWebhook,
  verifyWebhookSignature,
  validateWebhookData,
  createPaymentRecord,
  updateInvoiceStatus,
  updateSubscriptionStatus,
  logWebhookEvent,
  verifyPayFastIP,
};
