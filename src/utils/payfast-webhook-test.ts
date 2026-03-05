/**
 * PayFast Webhook Testing Utilities
 *
 * Helper functions for testing PayFast webhook integration locally
 */

import type { PayFastWebhookPayload } from "@/services/payfast-webhook.service";

/**
 * Generate sample webhook data for testing
 */
export const generateSampleWebhookData = (
  invoiceId: string,
  userId: string,
  paymentStatus: "COMPLETE" | "FAILED" | "PENDING" = "COMPLETE",
): Partial<PayFastWebhookPayload> => {
  return {
    m_payment_id: invoiceId,
    pf_payment_id: `${Math.floor(Math.random() * 1000000)}`,
    payment_status: paymentStatus,
    item_name: `Invoice INV-${invoiceId}`,
    item_description: `Payment for invoice INV-${invoiceId}`,
    amount_gross: "1000.00",
    amount_fee: "11.50",
    amount_net: "988.50",
    custom_str1: invoiceId,
    custom_str2: userId,
    custom_int1: "0", // 0 = invoice payment
    name_first: "Test",
    name_last: "Customer",
    email_address: "test@example.com",
    merchant_id: import.meta.env.VITE_PAYFAST_MERCHANT_ID || "10000100",
  };
};

/**
 * Generate sample subscription webhook data for testing
 */
export const generateSampleSubscriptionWebhookData = (
  subscriptionId: string,
  userId: string,
  paymentStatus: "COMPLETE" | "FAILED" | "PENDING" = "COMPLETE",
): Partial<PayFastWebhookPayload> => {
  return {
    m_payment_id: `SUB-${subscriptionId}`,
    pf_payment_id: `${Math.floor(Math.random() * 1000000)}`,
    payment_status: paymentStatus,
    item_name: "Pro Plan Subscription",
    item_description: "monthly subscription to Pro plan",
    amount_gross: "299.00",
    amount_fee: "7.48",
    amount_net: "291.52",
    custom_str1: subscriptionId,
    custom_str2: userId,
    custom_int1: "1", // 1 = subscription payment
    name_first: "Test",
    name_last: "Subscriber",
    email_address: "subscriber@example.com",
    merchant_id: import.meta.env.VITE_PAYFAST_MERCHANT_ID || "10000100",
  };
};

/**
 * Log webhook data for debugging
 */
export const logWebhookData = (data: Partial<PayFastWebhookPayload>) => {
  console.group("🔔 PayFast Webhook Data");
  console.log("Payment ID:", data.m_payment_id);
  console.log("PayFast Payment ID:", data.pf_payment_id);
  console.log("Status:", data.payment_status);
  console.log("Amount Gross:", data.amount_gross);
  console.log("Amount Fee:", data.amount_fee);
  console.log("Amount Net:", data.amount_net);
  console.log("Invoice/Subscription ID:", data.custom_str1);
  console.log("User ID:", data.custom_str2);
  console.log("Payment Type:", data.custom_int1 === "0" ? "Invoice" : "Subscription");
  console.groupEnd();
};

/**
 * Test webhook handler locally (for development)
 *
 * Example usage:
 * ```
 * import { testWebhookLocally } from "@/utils/payfast-webhook-test";
 *
 * // Test invoice payment
 * await testWebhookLocally("invoice-123", "user-456");
 *
 * // Test subscription payment
 * await testWebhookLocally("subscription-789", "user-456", "COMPLETE", "subscription");
 * ```
 */
export const testWebhookLocally = async (
  id: string,
  userId: string,
  status: "COMPLETE" | "FAILED" | "PENDING" = "COMPLETE",
  type: "invoice" | "subscription" = "invoice",
): Promise<void> => {
  const webhookData =
    type === "invoice"
      ? generateSampleWebhookData(id, userId, status)
      : generateSampleSubscriptionWebhookData(id, userId, status);

  console.log("🧪 Testing PayFast Webhook Handler Locally");
  logWebhookData(webhookData);

  try {
    const response = await fetch("/.netlify/functions/payfast-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(webhookData as Record<string, string>),
    });

    const result = await response.json();
    console.log("✅ Webhook Response:", result);
  } catch (error) {
    console.error("❌ Webhook Test Failed:", error);
  }
};

export default {
  generateSampleWebhookData,
  generateSampleSubscriptionWebhookData,
  logWebhookData,
  testWebhookLocally,
};
