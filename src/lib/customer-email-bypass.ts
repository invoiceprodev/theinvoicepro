import type { AuthAppKind } from "@/lib/auth0-config";

function envFlag(value: unknown) {
  return value === "true" || value === true || value === "1" || value === 1;
}

export function isCustomerEmailVerificationBypassEnabled() {
  return import.meta.env.DEV && envFlag(import.meta.env.VITE_CUSTOMER_EMAIL_VERIFICATION_BYPASS_ENABLED);
}

export function isAdminEmailVerificationBypassEnabled() {
  return import.meta.env.DEV && envFlag(import.meta.env.VITE_ADMIN_EMAIL_VERIFICATION_BYPASS_ENABLED);
}

export function shouldBypassEmailVerification(appKind: AuthAppKind) {
  if (appKind === "customer") {
    return isCustomerEmailVerificationBypassEnabled();
  }

  if (appKind === "admin") {
    return isAdminEmailVerificationBypassEnabled();
  }

  return false;
}
