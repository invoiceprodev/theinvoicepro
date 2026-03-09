import { apiRequest, hasApiBaseUrl } from "@/lib/api-client";
import { generateExpenseReceiptPDF } from "@/lib/pdf-generator";
import type { Expense, Profile } from "@/types";

export async function sendExpenseReceiptEmail(input: {
  expense: Expense;
  businessProfile?: Profile;
  recipientEmail?: string;
  recipientName?: string;
  includeAttachment?: boolean;
}) {
  if (!hasApiBaseUrl()) {
    throw new Error("Email service is not configured. Please configure VITE_API_URL for the local API.");
  }

  const toEmail = input.recipientEmail || input.expense.recipient_email || input.expense.recipientEmail;
  if (!toEmail) {
    throw new Error("Recipient email is required to send a receipt.");
  }

  let pdfBase64 = "";
  if (input.includeAttachment ?? true) {
    pdfBase64 = await generateExpenseReceiptPDF(input.expense, input.businessProfile);
  }

  await apiRequest<{ ok: true; id: string }>("/emails/expense", {
    method: "POST",
    body: JSON.stringify({
      to: toEmail,
      toName: input.recipientName || input.expense.recipient,
      expenseCategory: input.expense.category,
      expenseDate: new Date(input.expense.date).toLocaleDateString(),
      expenseAmount: `${Number(input.expense.amount).toFixed(2)}`,
      paymentMethod: input.expense.payment_method || input.expense.paymentMethod || "N/A",
      businessName: input.businessProfile?.company_name || "Your Company",
      businessEmail: input.businessProfile?.business_email || "",
      notes: input.expense.notes || "",
      pdfBase64,
    }),
  });
}

export function isExpenseEmailReady() {
  return hasApiBaseUrl();
}
