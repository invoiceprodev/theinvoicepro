import { createHmac } from "node:crypto";
import { apiConfig } from "./config.js";

type BillingCycle = "monthly" | "yearly";

interface PaystackInitializeInput {
  email: string;
  amount: number;
  subscriptionId: string;
  planId: string;
  planName: string;
  userId: string;
  trialDays: number;
  billingCycle: BillingCycle;
}

interface PaystackApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyData {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown> | null;
  customer?: {
    customer_code?: string;
    email?: string;
  } | null;
  authorization?: {
    authorization_code?: string;
    reusable?: boolean;
    last4?: string;
    exp_month?: string;
    exp_year?: string;
    card_type?: string;
    bank?: string;
  } | null;
  gateway_response?: string;
}

function paystackRequestHeaders() {
  if (!apiConfig.paystackSecretKey) {
    throw new Error("Paystack secret key is not configured on the API.");
  }

  return {
    Authorization: `Bearer ${apiConfig.paystackSecretKey}`,
    "Content-Type": "application/json",
  };
}

async function paystackRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      ...paystackRequestHeaders(),
      ...(init.headers || {}),
    },
  });

  const body = (await response.json().catch(() => null)) as PaystackApiResponse<T> | { message?: string } | null;

  if (!response.ok || !body || !("status" in body) || body.status !== true) {
    const message = body && "message" in body && typeof body.message === "string" ? body.message : "Paystack request failed";
    throw new Error(message);
  }

  return body.data;
}

function toKobo(amount: number) {
  return Math.round(amount * 100);
}

export function isPaystackConfigured() {
  return Boolean(apiConfig.paystackSecretKey);
}

export async function initializePaystackSubscriptionCheckout(input: PaystackInitializeInput) {
  const callbackBase =
    apiConfig.paystackCallbackUrl ||
    `${apiConfig.customerAppUrl}/auth/card-setup/success?provider=paystack&subscription_id=${encodeURIComponent(input.subscriptionId)}&plan_id=${encodeURIComponent(input.planId)}`;

  const callbackUrl = callbackBase.includes("?")
    ? `${callbackBase}&plan_name=${encodeURIComponent(input.planName)}&trial_days=${input.trialDays}&amount=${input.amount}`
    : `${callbackBase}?plan_name=${encodeURIComponent(input.planName)}&trial_days=${input.trialDays}&amount=${input.amount}`;

  const data = await paystackRequest<PaystackInitializeData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: toKobo(input.amount),
      currency: "ZAR",
      callback_url: callbackUrl,
      metadata: {
        provider: "paystack",
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        planId: input.planId,
        planName: input.planName,
        trialDays: input.trialDays,
        billingCycle: input.billingCycle,
      },
    }),
  });

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

export async function verifyPaystackTransaction(reference: string) {
  return paystackRequest<PaystackVerifyData>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function verifyPaystackWebhookSignature(rawBody: Buffer, signature?: string | null) {
  if (!signature || !apiConfig.paystackWebhookSecret) {
    return false;
  }

  const digest = createHmac("sha512", apiConfig.paystackWebhookSecret).update(rawBody).digest("hex");
  return digest === signature;
}
