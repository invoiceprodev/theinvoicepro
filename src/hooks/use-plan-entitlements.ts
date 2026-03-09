import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { getPlanEntitlements } from "@/lib/plan-entitlements";
import { useSubscriptionState } from "@/hooks/use-subscription-state";

interface UsageSnapshot {
  savedClients: number;
  invoicesThisMonth: number;
}

export function usePlanEntitlements() {
  const { loading: subscriptionLoading, subscription, state } = useSubscriptionState();
  const [usage, setUsage] = useState<UsageSnapshot>({ savedClients: 0, invoicesThisMonth: 0 });
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      if (!subscription) {
        setUsage({ savedClients: 0, invoicesThisMonth: 0 });
        return;
      }

      setUsageLoading(true);
      try {
        const response = await apiRequest<{ data: UsageSnapshot }>("/subscription/usage");
        if (!cancelled) {
          setUsage(response.data);
        }
      } catch {
        if (!cancelled) {
          setUsage({ savedClients: 0, invoicesThisMonth: 0 });
        }
      } finally {
        if (!cancelled) {
          setUsageLoading(false);
        }
      }
    }

    void loadUsage();

    return () => {
      cancelled = true;
    };
  }, [subscription?.id]);

  const entitlements = getPlanEntitlements(subscription?.plan);

  return {
    subscription,
    subscriptionState: state,
    loading: subscriptionLoading || usageLoading,
    usage,
    entitlements,
    canCreateClient: entitlements.maxSavedClients == null || usage.savedClients < entitlements.maxSavedClients,
    canCreateInvoice:
      entitlements.maxInvoicesPerMonth == null || usage.invoicesThisMonth < entitlements.maxInvoicesPerMonth,
    canUseQuotes: entitlements.quotesEnabled,
  };
}
