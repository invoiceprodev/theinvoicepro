import type { CurrentSubscriptionState, Plan } from "@/types";

export const SUBSCRIPTION_REQUIRED_MESSAGE = "You can't use this feature if you are not subscribed.";
export const SUBSCRIPTION_REQUIRED_DESCRIPTION = "Choose Starter/Trial or another plan from Plans to unlock it.";

export function hasDashboardFeatureAccess(state: CurrentSubscriptionState) {
  return state === "trial_active" || state === "active";
}

export function isSubscriptionGateExemptResource(resource?: string | null) {
  return resource === "dashboard" || resource === "plans";
}

export function isSubscriptionGateExemptRoute(route?: string | null) {
  if (!route) return false;

  return route === "/dashboard" || route.startsWith("/plans");
}

export function getDefaultStarterPlan(plans: Plan[]) {
  return (
    plans.find((plan) => {
      const name = plan.name.toLowerCase();
      return name.includes("starter") || name.includes("trial") || name === "basic";
    }) ?? null
  );
}
