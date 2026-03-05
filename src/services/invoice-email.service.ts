import { sendEmail, isEmailJSConfigured } from "@/lib/emailjs";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import type { Invoice, Profile } from "@/types";

export interface SendInvoiceEmailParams {
  invoice: Invoice;
  recipientEmail?: string; // Optional, defaults to client email
  recipientName?: string; // Optional, defaults to client name
  businessProfile?: Profile;
  includeAttachment?: boolean; // Whether to include PDF attachment
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
}: SendInvoiceEmailParams): Promise<void> => {
  // Check if EmailJS is configured
  if (!isEmailJSConfigured()) {
    throw new Error("Email service is not configured. Please configure EmailJS in your environment variables.");
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
    pdfBase64 = await generateInvoicePDF(invoice, businessProfile);
  }

  // Prepare email template parameters
  const templateParams = {
    to_email: toEmail,
    to_name: toName,
    invoice_number: invoice.invoice_number,
    invoice_total: `${Number(invoice.total).toFixed(2)}`,
    invoice_date: new Date(invoice.invoice_date).toLocaleDateString(),
    due_date: new Date(invoice.due_date).toLocaleDateString(),
    invoice_status: invoice.status.toUpperCase(),
    business_name: businessProfile?.company_name || "Your Company",
    business_email: businessProfile?.business_email || "",
    pdf_data: pdfBase64,
    // Additional fields for customization
    client_company: invoice.client.company || "",
    subtotal: `${Number(invoice.subtotal).toFixed(2)}`,
    tax_amount: `${Number(invoice.tax_amount).toFixed(2)}`,
    notes: invoice.notes || "",
  };

  try {
    await sendEmail(templateParams);
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    throw new Error("Failed to send invoice email. Please try again.");
  }
};

/**
 * Check if email service is ready
 */
export const isEmailServiceReady = (): boolean => {
  return isEmailJSConfigured();
};

/**
 * Get email service configuration status
 */
export const getEmailServiceStatus = (): {
  configured: boolean;
  message: string;
} => {
  const configured = isEmailJSConfigured();

  if (configured) {
    return {
      configured: true,
      message: "Email service is configured and ready to use.",
    };
  }

  return {
    configured: false,
    message:
      "Email service is not configured. Please add EmailJS credentials to your .env file. See .env.example for required variables.",
  };
};
