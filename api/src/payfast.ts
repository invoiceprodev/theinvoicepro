import { createHash } from "node:crypto";
import { apiConfig } from "./config.js";

type BillingCycle = "monthly" | "yearly";

interface TrialCheckoutInput {
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  subscriptionId: string;
  planName: string;
  trialDays: number;
  billingCycle: BillingCycle;
}

function encodeValue(value: string | number) {
  return encodeURIComponent(String(value).trim());
}

function buildSignature(data: Record<string, string | number>) {
  const paramString = Object.keys(data)
    .filter((key) => key !== "signature")
    .sort()
    .map((key) => `${key}=${encodeValue(data[key])}`)
    .join("&");

  const signatureString = apiConfig.payfastPassphrase
    ? `${paramString}&passphrase=${encodeURIComponent(apiConfig.payfastPassphrase)}`
    : paramString;

  return createHash("md5").update(signatureString).digest("hex");
}

export function verifyPayFastSignature(payload: Record<string, string | number>) {
  const receivedSignature = String(payload.signature || "").trim().toLowerCase();
  if (!receivedSignature) {
    return false;
  }

  const expectedSignature = buildSignature(payload).toLowerCase();
  return expectedSignature === receivedSignature;
}

function getTrialEndDate(trialDays: number) {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);
  return trialEndDate.toISOString().split("T")[0];
}

export function buildTrialSubscriptionCheckout(input: TrialCheckoutInput) {
  if (!apiConfig.payfastMerchantId || !apiConfig.payfastMerchantKey) {
    throw new Error("PayFast credentials are not configured on the API.");
  }

  const merchantPaymentId = `TRIAL_${input.userId}_${Date.now()}`;
  const billingDate = getTrialEndDate(input.trialDays);
  const returnUrl = `${apiConfig.customerAppUrl}/auth/card-setup/success?user_id=${input.userId}&subscription_id=${input.subscriptionId}`;
  const cancelUrl = `${apiConfig.customerAppUrl}/auth/card-setup?user_id=${input.userId}&email=${encodeURIComponent(input.userEmail)}&name=${encodeURIComponent(input.userName)}&error=cancelled`;
  const notifyUrl = apiConfig.payfastNotifyUrl || `${apiConfig.apiBaseUrl}/payfast/webhook`;

  const [firstName, ...restName] = input.userName.trim().split(/\s+/);
  const lastName = restName.join(" ");
  const paymentData = {
    merchant_id: apiConfig.payfastMerchantId,
    merchant_key: apiConfig.payfastMerchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    name_first: firstName || input.userName,
    name_last: lastName,
    email_address: input.userEmail,
    m_payment_id: merchantPaymentId,
    amount: input.amount.toFixed(2),
    item_name: `${input.planName} Trial`,
    item_description:
      input.trialDays > 0
        ? `${input.trialDays}-day free trial, then R${input.amount}/${input.billingCycle === "yearly" ? "year" : "month"}`
        : `${input.planName} recurring subscription`,
    subscription_type: "1",
    billing_date: billingDate,
    recurring_amount: input.amount.toFixed(2),
    frequency: input.billingCycle === "yearly" ? "6" : "3",
    cycles: "0",
    custom_str1: input.userId,
    custom_str2: input.subscriptionId,
    custom_str3: "trial_subscription",
  };

  const signature = buildSignature(paymentData);
  const payfastUrl = apiConfig.payfastMode === "live" ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process";
  const url = `${payfastUrl}?${new URLSearchParams({ ...paymentData, signature }).toString()}`;

  return {
    url,
    signature,
    debug: {
      mode: apiConfig.payfastMode,
      payfastUrl,
      merchantId: apiConfig.payfastMerchantId,
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
