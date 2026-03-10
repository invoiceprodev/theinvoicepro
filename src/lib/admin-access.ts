function envFlag(value: unknown) {
  return value === "true" || value === "1";
}

export function isAdminAccessBypassEnabled() {
  return import.meta.env.DEV && envFlag(import.meta.env.VITE_ADMIN_ACCESS_BYPASS_ENABLED);
}

export function canAccessAdminPortal(role?: string | null) {
  return role === "admin" || isAdminAccessBypassEnabled();
}

export function getEffectiveAdminRole(role?: "user" | "admin" | null): "user" | "admin" {
  return canAccessAdminPortal(role) ? "admin" : "user";
}
