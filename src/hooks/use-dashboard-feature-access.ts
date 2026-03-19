"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import {
  hasDashboardFeatureAccess,
  SUBSCRIPTION_REQUIRED_DESCRIPTION,
  SUBSCRIPTION_REQUIRED_MESSAGE,
} from "@/lib/subscription-access";
import { isAdminContext } from "@/lib/admin-routing";

export function useDashboardFeatureAccess() {
  const { loading, state } = useSubscriptionState();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isAdminRoute = isAdminContext(pathname);
  const hasAccess = isAdminRoute || hasDashboardFeatureAccess(state);
  const isBlocked = !loading && !hasAccess;

  const showBlockedMessage = useCallback(() => {
    toast.error(SUBSCRIPTION_REQUIRED_MESSAGE, {
      description: SUBSCRIPTION_REQUIRED_DESCRIPTION,
    });
  }, []);

  return {
    loading,
    hasAccess,
    isBlocked,
    showBlockedMessage,
  };
}
