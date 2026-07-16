import type { Subscription } from "@/types";

export interface SubscriptionBridgeSnapshot {
  isLoading: boolean;
  subscription: Subscription | null;
}

let snapshot: SubscriptionBridgeSnapshot = {
  isLoading: false,
  subscription: null,
};

const listeners = new Set<(next: SubscriptionBridgeSnapshot) => void>();

export function setSubscriptionBridgeSnapshot(next: SubscriptionBridgeSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
}

export function getSubscriptionBridgeSnapshot() {
  return snapshot;
}

export function subscribeSubscriptionBridge(listener: (next: SubscriptionBridgeSnapshot) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
