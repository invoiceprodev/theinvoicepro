export type AuthFlowMode = "login" | "signup" | "admin-login";

export interface PendingAuthHandoff {
  mode: AuthFlowMode;
  email?: string;
  fullName?: string;
  returnTo: string;
}

const STORAGE_KEY = "auth0_pending_handoff";

export function setPendingAuthHandoff(handoff: PendingAuthHandoff) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(handoff));
}

export function getPendingAuthHandoff(): PendingAuthHandoff | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingAuthHandoff;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearPendingAuthHandoff() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
