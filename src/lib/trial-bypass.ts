import type { Plan } from "@/types";

function envFlag(value: unknown) {
  return value === "true" || value === true || value === "1" || value === 1;
}

export function isTrialBypassEnabled() {
  return import.meta.env.DEV && envFlag(import.meta.env.VITE_TRIAL_BYPASS_ENABLED);
}

export function canStartTrialWithoutCard(plan?: Pick<Plan, "trial_days"> | null) {
  return isTrialBypassEnabled() && Number(plan?.trial_days || 0) > 0;
}
