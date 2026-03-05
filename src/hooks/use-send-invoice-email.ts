import { useState } from "react";
import { useOne } from "@refinedev/core";
import { sendInvoiceEmail, isEmailServiceReady } from "@/services/invoice-email.service";
import type { Invoice, Profile } from "@/types";

interface UseSendInvoiceEmailProps {
  invoice: Invoice;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useSendInvoiceEmail = ({ invoice, onSuccess, onError }: UseSendInvoiceEmailProps) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch business profile for email customization
  const { query } = useOne<Profile>({
    resource: "profiles",
    id: invoice.user_id,
    queryOptions: {
      enabled: !!invoice.user_id,
    },
  });

  const businessProfile = query.data?.data;

  const sendEmail = async (options?: {
    recipientEmail?: string;
    recipientName?: string;
    includeAttachment?: boolean;
  }) => {
    // Check if email service is configured
    if (!isEmailServiceReady()) {
      const errorMsg = "Email service is not configured. Please add EmailJS credentials to your .env file.";
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await sendInvoiceEmail({
        invoice,
        businessProfile,
        recipientEmail: options?.recipientEmail,
        recipientName: options?.recipientName,
        includeAttachment: options?.includeAttachment ?? true,
      });

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send email";
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendEmail,
    isSending,
    error,
    isConfigured: isEmailServiceReady(),
  };
};
