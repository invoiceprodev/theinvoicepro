import type { Plan } from "@/types";

export function planRequiresCard(plan?: Pick<Plan, "requires_card"> | null) {
  return Boolean(plan?.requires_card);
}

export function canStartTrialWithoutCard(plan?: Pick<Plan, "trial_days" | "requires_card"> | null) {
  return Number(plan?.trial_days || 0) > 0 && !planRequiresCard(plan);
}
