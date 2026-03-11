import { apiConfig } from "./config.js";

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

export async function sendWelcomeEmail(input: { email: string; fullName?: string }) {
  const name = input.fullName?.trim() || "there";

  return sendResendEmail({
    to: input.email,
    subject: "Welcome to InvoicePro",
    text: `Hi ${name}, welcome to InvoicePro. Your account is ready and you can now start using your dashboard.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="margin-bottom: 16px;">Welcome to InvoicePro</h1>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your account is ready. You can now start creating invoices, managing clients, and tracking expenses in your dashboard.</p>
        <p style="margin-top: 24px;">Thanks,<br />The InvoicePro Team</p>
      </div>
    `,
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
  return sendResendEmail({
    to: input.to,
    subject: `Invoice ${input.invoiceNumber} from ${input.businessName}`,
    text: `Hi ${input.toName}, your invoice ${input.invoiceNumber} for ${input.invoiceTotal} is ready. Due date: ${input.dueDate}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="margin-bottom: 16px;">Invoice ${escapeHtml(input.invoiceNumber)}</h1>
        <p>Hi ${escapeHtml(input.toName)},</p>
        <p>Please find your invoice details below.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Business</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.businessName)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Invoice Number</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.invoiceNumber)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Invoice Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.invoiceDate)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Due Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.dueDate)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Status</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.invoiceStatus)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Total</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.invoiceTotal)}</td></tr>
        </table>
        ${input.notes ? `<p><strong>Notes:</strong> ${escapeHtml(input.notes)}</p>` : ""}
        ${input.businessEmail ? `<p>If you have questions, reply to ${escapeHtml(input.businessEmail)}.</p>` : ""}
        ${input.includePlatformBranding === false ? "" : `<p style="margin-top: 24px; color: #64748b; font-size: 12px;">Sent with InvoicePro</p>`}
      </div>
    `,
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
  return sendResendEmail({
    to: input.to,
    subject: `${input.expenseCategory} receipt from ${input.businessName}`,
    text: `Hi ${input.toName}, your ${input.expenseCategory.toLowerCase()} receipt for ${input.expenseAmount} is attached. Payment method recorded: ${input.paymentMethod}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="margin-bottom: 16px;">${escapeHtml(input.expenseCategory)} Receipt</h1>
        <p>Hi ${escapeHtml(input.toName)},</p>
        <p>Please find your receipt details below.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Business</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.businessName)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Category</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.expenseCategory)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.expenseDate)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Amount</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.expenseAmount)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Payment Method</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(input.paymentMethod)}</td></tr>
        </table>
        ${input.notes ? `<p><strong>Notes:</strong> ${escapeHtml(input.notes)}</p>` : ""}
        ${input.businessEmail ? `<p>If you have questions, reply to ${escapeHtml(input.businessEmail)}.</p>` : ""}
      </div>
    `,
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
  const metadataRows = Object.entries(input.metadata || {})
    .map(
      ([label, value]) =>
        `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>${escapeHtml(label)}</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return sendResendEmail({
    to: input.to,
    subject: input.subject,
    text: `Hi ${input.toName}, ${input.message}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="margin-bottom: 16px;">${escapeHtml(input.subject)}</h1>
        <p>Hi ${escapeHtml(input.toName)},</p>
        <p>${escapeHtml(input.message)}</p>
        ${metadataRows ? `<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">${metadataRows}</table>` : ""}
      </div>
    `,
  });
}

export async function sendFooterSubscriptionEmail(input: { name: string; email: string }) {
  const trimmedName = input.name.trim();
  const trimmedEmail = input.email.trim();

  return sendResendEmail({
    to: "hello@theinvoicepro.co.za",
    subject: "New footer subscription",
    text: `A new footer subscription was submitted.\n\nName: ${trimmedName}\nEmail: ${trimmedEmail}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="margin-bottom: 16px;">New footer subscription</h1>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Name</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(trimmedName)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(trimmedEmail)}</td></tr>
        </table>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
