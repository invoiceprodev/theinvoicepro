import { apiRequest, hasApiBaseUrl } from "@/lib/api-client";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import type { Invoice, Profile } from "@/types";

export interface SendInvoiceEmailParams {
  invoice: Invoice;
  recipientEmail?: string; // Optional, defaults to client email
  recipientName?: string; // Optional, defaults to client name
  businessProfile?: Profile;
  includeAttachment?: boolean; // Whether to include PDF attachment
  includePlatformBranding?: boolean;
}

/**
 * Send invoice via email with PDF attachment
 */
export const sendInvoiceEmail = async ({
  invoice,
  recipientEmail,
  recipientName,
  businessProfile,
  includeAttachment = true,
  includePlatformBranding = true,
}: SendInvoiceEmailParams): Promise<void> => {
  if (!hasApiBaseUrl()) {
    throw new Error("Email service is not configured. Please configure VITE_API_URL for the local API.");
  }

  // Validate invoice has client
  if (!invoice.client) {
    throw new Error("Invoice must have client information to send email.");
  }

  // Use provided email or fallback to client email
  const toEmail = recipientEmail || invoice.client.email;
  const toName = recipientName || invoice.client.name;

  if (!toEmail) {
    throw new Error("Client email is required to send invoice.");
  }

  // Generate PDF if attachment is requested
  let pdfBase64 = "";
  if (includeAttachment) {
    pdfBase64 = await generateInvoicePDF(invoice, businessProfile, {
      includePlatformBranding,
    });
  }

  try {
    await apiRequest<{ ok: true; id: string }>("/emails/invoice", {
      method: "POST",
      body: JSON.stringify({
        to: toEmail,
        toName,
        invoiceNumber: invoice.invoice_number,
        invoiceTotal: `${Number(invoice.total).toFixed(2)}`,
        invoiceDate: new Date(invoice.invoice_date).toLocaleDateString(),
        dueDate: new Date(invoice.due_date).toLocaleDateString(),
        invoiceStatus: String(invoice.status).toUpperCase(),
        businessName: businessProfile?.company_name || "Your Company",
        businessEmail: businessProfile?.business_email || "",
        notes: invoice.notes || "",
        includePlatformBranding,
        pdfBase64,
      }),
    });
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    throw new Error("Failed to send invoice email. Please try again.");
  }
};

/**
 * Check if email service is ready
 */
export const isEmailServiceReady = (): boolean => {
  return hasApiBaseUrl();
};

/**
 * Get email service configuration status
 */
export const getEmailServiceStatus = (): {
  configured: boolean;
  message: string;
} => {
  const configured = hasApiBaseUrl();

  if (configured) {
    return {
      configured: true,
      message: "Email service is configured and ready to use through the API.",
    };
  }

  return {
    configured: false,
    message:
      "Email service is not configured. Please add VITE_API_URL to your .env file and run the local API.",
  };
};
