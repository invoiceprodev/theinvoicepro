import type { Profile } from "@/types";

export interface ProfileBridgeSnapshot {
  isLoading: boolean;
  profile: Profile | null;
  auth0User: Record<string, unknown> | null;
}

let snapshot: ProfileBridgeSnapshot = {
  isLoading: false,
  profile: null,
  auth0User: null,
};

const listeners = new Set<(next: ProfileBridgeSnapshot) => void>();

export function setProfileBridgeSnapshot(next: ProfileBridgeSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
}

export function getProfileBridgeSnapshot() {
  return snapshot;
}

export function subscribeProfileBridge(listener: (next: ProfileBridgeSnapshot) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
