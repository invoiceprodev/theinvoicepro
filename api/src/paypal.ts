import { apiConfig } from "./config.js";

type BillingCycle = "monthly" | "yearly";

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface PayPalApiErrorResponse {
  name?: string;
  message?: string;
  details?: Array<{ issue?: string; description?: string }>;
}

interface PayPalCreateProductResponse {
  id: string;
}

interface PayPalCreatePlanResponse {
  id: string;
}

export interface PayPalCreateSubscriptionResponse {
  id: string;
  status: string;
  links?: PayPalLink[];
}

export interface PayPalSubscriptionDetails {
  id: string;
  status: string;
  custom_id?: string;
  plan_id?: string;
  subscriber?: {
    email_address?: string;
  } | null;
}

interface PayPalInitializeInput {
  email: string;
  fullName: string;
  amount: number;
  currency: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  userId: string;
  trialDays: number;
  billingCycle: BillingCycle;
}

interface PayPalWebhookVerificationInput {
  headers: {
    transmissionId?: string | null;
    transmissionTime?: string | null;
    transmissionSig?: string | null;
    certUrl?: string | null;
    authAlgo?: string | null;
  };
  body: Record<string, unknown>;
}

let tokenCache: { value: string; expiresAt: number } | null = null;

function getPayPalApiBaseUrl() {
  return apiConfig.paypalMode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function getPayPalBasicAuth() {
  if (!apiConfig.paypalClientId || !apiConfig.paypalClientSecret) {
    throw new Error("PayPal credentials are not configured on the API.");
  }

  return Buffer.from(`${apiConfig.paypalClientId}:${apiConfig.paypalClientSecret}`).toString("base64");
}

async function getPayPalAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.value;
  }

  const response = await fetch(`${getPayPalApiBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getPayPalBasicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const body = (await response.json().catch(() => null)) as PayPalTokenResponse | PayPalApiErrorResponse | null;
  if (!response.ok || !body || !("access_token" in body) || typeof body.access_token !== "string") {
    const message =
      body && "message" in body && typeof body.message === "string" ? body.message : "Failed to authenticate with PayPal";
    throw new Error(message);
  }

  tokenCache = {
    value: body.access_token,
    expiresAt: Date.now() + Math.max(60, Number(body.expires_in || 300) - 60) * 1000,
  };

  return tokenCache.value;
}

async function paypalRequest<T>(path: string, init: RequestInit = {}) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const body = (await response.json().catch(() => null)) as T | PayPalApiErrorResponse | null;
  if (!response.ok || !body) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `PayPal request failed (${response.status})`;
    throw new Error(message);
  }

  return body as T;
}

function getFrequency(billingCycle: BillingCycle) {
  if (billingCycle === "yearly") {
    return { interval_unit: "YEAR", interval_count: 1 };
  }

  return { interval_unit: "MONTH", interval_count: 1 };
}

async function createPayPalProduct(planName: string) {
  const product = await paypalRequest<PayPalCreateProductResponse>("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify({
      name: `InvoicePro ${planName}`,
      description: `${planName} subscription for InvoicePro`,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });

  return product.id;
}

async function createPayPalPlan(input: {
  productId: string;
  planName: string;
  amount: number;
  currency: string;
  trialDays: number;
  billingCycle: BillingCycle;
}) {
  const frequency = getFrequency(input.billingCycle);
  const billingCycles: Array<Record<string, unknown>> = [];

  if (input.trialDays > 0) {
    billingCycles.push({
      frequency: {
        interval_unit: "DAY",
        interval_count: input.trialDays,
      },
      tenure_type: "TRIAL",
      sequence: 1,
      total_cycles: 1,
      pricing_scheme: {
        fixed_price: {
          value: "0",
          currency_code: input.currency,
        },
      },
    });
  }

  billingCycles.push({
    frequency,
    tenure_type: "REGULAR",
    sequence: input.trialDays > 0 ? 2 : 1,
    total_cycles: 0,
    pricing_scheme: {
      fixed_price: {
        value: input.amount.toFixed(2),
        currency_code: input.currency,
      },
    },
  });

  const plan = await paypalRequest<PayPalCreatePlanResponse>("/v1/billing/plans", {
    method: "POST",
    body: JSON.stringify({
      product_id: input.productId,
      name: `${input.planName} ${input.billingCycle} plan`,
      description: `Recurring ${input.billingCycle} billing for ${input.planName}`,
      status: "ACTIVE",
      billing_cycles: billingCycles,
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });

  return plan.id;
}

export function isPayPalConfigured() {
  return Boolean(apiConfig.paypalClientId && apiConfig.paypalClientSecret);
}

export async function initializePayPalSubscriptionCheckout(input: PayPalInitializeInput) {
  const callbackBase = apiConfig.paypalCallbackUrl || `${apiConfig.customerAppUrl}/auth/card-setup/success`;
  const returnUrl = new URL(callbackBase);
  returnUrl.searchParams.set("provider", "paypal");
  returnUrl.searchParams.set("app_subscription_id", input.subscriptionId);
  returnUrl.searchParams.set("plan_id", input.planId);
  returnUrl.searchParams.set("plan_name", input.planName);
  returnUrl.searchParams.set("trial_days", String(input.trialDays));
  returnUrl.searchParams.set("amount", String(input.amount));

  const cancelUrl = new URL(`${apiConfig.customerAppUrl}/auth/card-setup`);
  cancelUrl.searchParams.set("cancelled", "1");

  const productId = await createPayPalProduct(input.planName);
  const planId = await createPayPalPlan({
    productId,
    planName: input.planName,
    amount: input.amount,
    currency: input.currency,
    trialDays: input.trialDays,
    billingCycle: input.billingCycle,
  });

  const subscription = await paypalRequest<PayPalCreateSubscriptionResponse>("/v1/billing/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: planId,
      custom_id: input.subscriptionId,
      subscriber: {
        name: {
          given_name: input.fullName.trim().split(/\s+/)[0] || input.fullName,
          surname: input.fullName.trim().split(/\s+/).slice(1).join(" ") || input.fullName,
        },
        email_address: input.email,
      },
      application_context: {
        brand_name: "InvoicePro",
        user_action: "SUBSCRIBE_NOW",
        return_url: returnUrl.toString(),
        cancel_url: cancelUrl.toString(),
      },
    }),
  });

  const approvalUrl = subscription.links?.find((link) => link.rel === "approve")?.href;
  if (!approvalUrl) {
    throw new Error("PayPal did not return an approval URL.");
  }

  return {
    approvalUrl,
    paypalSubscriptionId: subscription.id,
  };
}

export async function getPayPalSubscriptionDetails(paypalSubscriptionId: string) {
  return paypalRequest<PayPalSubscriptionDetails>(`/v1/billing/subscriptions/${encodeURIComponent(paypalSubscriptionId)}`);
}

export async function verifyPayPalWebhookSignature(input: PayPalWebhookVerificationInput) {
  if (!apiConfig.paypalWebhookId) {
    return false;
  }

  const payload = await paypalRequest<{ verification_status?: string }>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      transmission_id: input.headers.transmissionId,
      transmission_time: input.headers.transmissionTime,
      cert_url: input.headers.certUrl,
      auth_algo: input.headers.authAlgo,
      transmission_sig: input.headers.transmissionSig,
      webhook_id: apiConfig.paypalWebhookId,
      webhook_event: input.body,
    }),
  });

  return payload.verification_status === "SUCCESS";
}
