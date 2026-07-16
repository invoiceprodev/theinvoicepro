import type { Invoice, Profile } from "@/types";

export async function sendInvoiceEmail(options: {
  invoice: Invoice;
  businessProfile?: Profile;
  recipientEmail?: string;
  recipientName?: string;
  includeAttachment?: boolean;
  includePlatformBranding?: boolean;
}) {
  return Promise.resolve({ success: true });
}

export function isEmailServiceReady() {
  return false;
}
