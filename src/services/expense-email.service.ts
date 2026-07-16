import type { Expense, Profile } from "@/types";

export async function sendExpenseReceiptEmail(options: {
  expense: Expense;
  businessProfile?: Profile;
  recipientEmail: string;
  recipientName?: string;
  includeAttachment?: boolean;
}) {
  return Promise.resolve({ success: true });
}
