import { useEffect, useMemo, useState } from "react";
import { getCurrentSubscriptionState, type Subscription } from "@/types";
import { getSubscriptionBridgeSnapshot, subscribeSubscriptionBridge } from "@/lib/subscription-bridge";

export function useSubscriptionState() {
  const [snapshot, setSnapshot] = useState(getSubscriptionBridgeSnapshot());

  useEffect(() => subscribeSubscriptionBridge(setSnapshot), []);

  return useMemo(
    () => ({
      loading: snapshot.isLoading,
      subscription: snapshot.subscription as Subscription | null,
      state: getCurrentSubscriptionState(snapshot.subscription),
    }),
    [snapshot],
  );
}
