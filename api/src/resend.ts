import { apiConfig } from "./config.js";
import { renderEmailHtml, renderEmailText } from "./emails/render.js";
import { createElement, type ReactElement } from "react";
import {
  ExpenseReceiptEmailTemplate,
  FooterSubscriptionEmailTemplate,
  InvoiceEmailTemplate,
  TeamInviteEmailTemplate,
  TestEmailTemplate,
  TrialLifecycleEmailTemplate,
  WelcomeEmailTemplate,
} from "./emails/templates.js";

interface ResendSendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

interface ResendSendEmailResponse {
  id: string;
}

export function isResendConfigured() {
  return Boolean(apiConfig.resendApiKey && apiConfig.resendFromEmail);
}

export async function sendResendEmail(payload: ResendSendEmailPayload): Promise<ResendSendEmailResponse> {
  if (!isResendConfigured()) {
    throw new Error("Resend is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiConfig.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: apiConfig.resendFromEmail,
      ...payload,
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body ? String((body as Record<string, unknown>).message) : "Failed to send Resend email.";
    throw new Error(message);
  }

  return body as ResendSendEmailResponse;
}

async function sendReactEmail(input: {
  to: string | string[];
  subject: string;
  template: ReactElement;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}) {
  return sendResendEmail({
    to: input.to,
    subject: input.subject,
    html: renderEmailHtml(input.template),
    text: input.text || renderEmailText(input.template),
    attachments: input.attachments,
  });
}

export async function sendWelcomeEmail(input: { email: string; fullName?: string }) {
  const name = input.fullName?.trim() || "there";

  return sendReactEmail({
    to: input.email,
    subject: "Welcome to InvoicePro",
    text: `Hi ${name}, welcome to InvoicePro. Your account is ready and you can now start using your dashboard.`,
    template: createElement(WelcomeEmailTemplate, { fullName: name }),
  });
}

export async function sendInvoiceEmail(input: {
  to: string;
  toName: string;
  invoiceNumber: string;
  invoiceTotal: string;
  invoiceDate: string;
  dueDate: string;
  invoiceStatus: string;
  businessName: string;
  businessEmail?: string;
  notes?: string;
  includePlatformBranding?: boolean;
  pdfBase64?: string;
}) {
  return sendReactEmail({
    to: input.to,
    subject: `Invoice ${input.invoiceNumber} from ${input.businessName}`,
    text: `Hi ${input.toName}, your invoice ${input.invoiceNumber} for ${input.invoiceTotal} is ready. Due date: ${input.dueDate}.`,
    template: createElement(InvoiceEmailTemplate, input),
    attachments: input.pdfBase64
      ? [
          {
            filename: `invoice-${input.invoiceNumber}.pdf`,
            content: input.pdfBase64,
          },
        ]
      : undefined,
  });
}

export async function sendExpenseReceiptEmail(input: {
  to: string;
  toName: string;
  expenseCategory: string;
  expenseDate: string;
  expenseAmount: string;
  paymentMethod: string;
  businessName: string;
  businessEmail?: string;
  notes?: string;
  pdfBase64?: string;
}) {
  return sendReactEmail({
    to: input.to,
    subject: `${input.expenseCategory} receipt from ${input.businessName}`,
    text: `Hi ${input.toName}, your ${input.expenseCategory.toLowerCase()} receipt for ${input.expenseAmount} is attached. Payment method recorded: ${input.paymentMethod}.`,
    template: createElement(ExpenseReceiptEmailTemplate, input),
    attachments: input.pdfBase64
      ? [
          {
            filename: `receipt-${input.expenseCategory.toLowerCase().replace(/\s+/g, "-")}.pdf`,
            content: input.pdfBase64,
          },
        ]
      : undefined,
  });
}

export async function sendTrialLifecycleEmail(input: {
  to: string;
  toName: string;
  subject: string;
  message: string;
  metadata?: Record<string, string>;
}) {
  return sendReactEmail({
    to: input.to,
    subject: input.subject,
    text: `Hi ${input.toName}, ${input.message}`,
    template: createElement(TrialLifecycleEmailTemplate, input),
  });
}

export type TrialEmailEventType =
  | "trial_started"
  | "trial_ending"
  | "subscription_activated"
  | "payment_failed";

export async function sendTrialEventEmail(input: {
  to: string;
  toName: string;
  event: TrialEmailEventType;
  planName: string;
  planPrice: string;
  trialEndDate?: string;
  renewalDate?: string;
  daysRemaining?: number;
  paymentId?: string;
  errorMessage?: string;
}) {
  const content = buildTrialEventEmailContent(input);
  return sendTrialLifecycleEmail({
    to: input.to,
    toName: input.toName,
    subject: content.subject,
    message: content.message,
    metadata: content.metadata,
  });
}

export async function sendFooterSubscriptionEmail(input: { name: string; email: string }) {
  const trimmedName = input.name.trim();
  const trimmedEmail = input.email.trim();

  return sendReactEmail({
    to: "hello@theinvoicepro.co.za",
    subject: "New footer subscription",
    text: `A new footer subscription was submitted.\n\nName: ${trimmedName}\nEmail: ${trimmedEmail}`,
    template: createElement(FooterSubscriptionEmailTemplate, {
      name: trimmedName,
      email: trimmedEmail,
    }),
  });
}

export async function sendTeamInviteEmail(input: {
  to: string;
  subject: string;
  recipientName: string;
  inviterName: string;
  companyName: string;
  role: string;
  signupUrl: string;
  existingAccount: boolean;
}) {
  return sendReactEmail({
    to: input.to,
    subject: input.subject,
    template: createElement(TeamInviteEmailTemplate, input),
  });
}

export async function sendTestEmail(input: { to: string }) {
  return sendReactEmail({
    to: input.to,
    subject: "InvoicePro Resend test",
    template: createElement(TestEmailTemplate),
  });
}

function buildTrialEventEmailContent(input: {
  event: TrialEmailEventType;
  planName: string;
  planPrice: string;
  trialEndDate?: string;
  renewalDate?: string;
  daysRemaining?: number;
  paymentId?: string;
  errorMessage?: string;
}): {
  subject: string;
  message: string;
  metadata: Record<string, string>;
} {
  switch (input.event) {
    case "trial_started":
      return {
        subject: `Welcome to Your ${input.planName} Trial!`,
        message: `Welcome to your ${input.planName} trial. Your free trial has started and will end on ${input.trialEndDate || "the scheduled end date"}. During your trial, you'll have full access to all features. After the trial period, your subscription will automatically convert to the paid plan at ${input.planPrice} unless you cancel.`,
        metadata: {
          Plan: input.planName,
          Price: input.planPrice,
          "Trial Ends": input.trialEndDate || "N/A",
        },
      };
    case "trial_ending":
      return {
        subject: `Your Trial Ends in ${input.daysRemaining ?? 0} Days`,
        message: `Your ${input.planName} trial is ending soon. You have ${input.daysRemaining ?? 0} days remaining. On ${input.trialEndDate || "the scheduled end date"}, your trial will convert to the paid plan at ${input.planPrice}. To avoid being charged, cancel before the trial ends.`,
        metadata: {
          Plan: input.planName,
          Price: input.planPrice,
          "Days Remaining": String(input.daysRemaining ?? 0),
          "Trial Ends": input.trialEndDate || "N/A",
        },
      };
    case "subscription_activated":
      return {
        subject: `Welcome to ${input.planName} Plan!`,
        message: `Your trial has ended and your subscription to the ${input.planName} plan is now active. Your first billing period has started at ${input.planPrice}. Your subscription will automatically renew on ${input.renewalDate || "the next renewal date"}.`,
        metadata: {
          Plan: input.planName,
          Price: input.planPrice,
          "Renewal Date": input.renewalDate || "N/A",
          "Payment ID": input.paymentId || "N/A",
        },
      };
    case "payment_failed":
      return {
        subject: "Action Required: Payment Failed",
        message: `We were unable to process your payment for the ${input.planName} plan (${input.planPrice}). Your subscription has been paused. Please update your payment method in your account settings to reactivate your subscription and continue accessing all features.`,
        metadata: {
          Plan: input.planName,
          Price: input.planPrice,
          Error: input.errorMessage || "N/A",
        },
      };
  }
}
