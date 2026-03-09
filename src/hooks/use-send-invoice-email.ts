import { useState } from "react";
import { sendInvoiceEmail, isEmailServiceReady } from "@/services/invoice-email.service";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import { getPlanEntitlements } from "@/lib/plan-entitlements";
import { getProfileBridgeSnapshot } from "@/lib/profile-bridge";
import type { Invoice, Profile } from "@/types";

interface UseSendInvoiceEmailProps {
  invoice?: Invoice | null;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useSendInvoiceEmail = ({ invoice, onSuccess, onError }: UseSendInvoiceEmailProps) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subscription } = useSubscriptionState();
  const entitlements = getPlanEntitlements(subscription?.plan);
  const businessProfile = getProfileBridgeSnapshot().profile as Profile | null;

  const sendEmail = async (options?: {
    recipientEmail?: string;
    recipientName?: string;
    includeAttachment?: boolean;
  }) => {
    if (!invoice) {
      const errorMsg = "Invoice details are still loading.";
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    // Check if email service is configured
    if (!isEmailServiceReady()) {
      const errorMsg = "Email service is not configured. Please start the local API and set VITE_API_URL.";
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await sendInvoiceEmail({
        invoice,
        businessProfile: businessProfile || undefined,
        recipientEmail: options?.recipientEmail,
        recipientName: options?.recipientName,
        includeAttachment: options?.includeAttachment ?? true,
        includePlatformBranding: !entitlements.removeBranding,
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
    isConfigured: isEmailServiceReady() && !!invoice,
  };
};
