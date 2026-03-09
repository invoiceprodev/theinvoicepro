import type { User } from "@auth0/auth0-react";

type LoginWithRedirect = (options?: Record<string, unknown>) => Promise<void>;
type Logout = (options?: Record<string, unknown>) => void;
type GetAccessTokenSilently = (options?: Record<string, unknown>) => Promise<string>;

export interface Auth0BridgeSnapshot {
  isLoading: boolean;
  isAuthenticated: boolean;
  user?: User;
  error?: Error;
  requiresEmailVerification?: boolean;
  verificationEmail?: string;
  loginWithRedirect?: LoginWithRedirect;
  logout?: Logout;
  getAccessTokenSilently?: GetAccessTokenSilently;
}

let snapshot: Auth0BridgeSnapshot = {
  isLoading: true,
  isAuthenticated: false,
};

const listeners = new Set<(next: Auth0BridgeSnapshot) => void>();

export function setAuth0BridgeSnapshot(next: Auth0BridgeSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
}

export function getAuth0BridgeSnapshot() {
  return snapshot;
}

export function subscribeAuth0Bridge(listener: (next: Auth0BridgeSnapshot) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
