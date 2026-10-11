import type { Plan } from "@/types";

export function planRequiresCard(plan?: Pick<Plan, "requires_card"> | null) {
  return Boolean(plan?.requires_card);
}

function isStarterStylePlan(plan?: Pick<Plan, "name"> | null) {
  const name = String(plan?.name || "").toLowerCase();
  return name.includes("starter") || name.includes("trial") || name === "basic";
}

export function canStartTrialWithoutCard(
  plan?: Pick<Plan, "name" | "trial_days" | "requires_card"> | null,
) {
  return (
    Number(plan?.trial_days || 0) > 0 &&
    !plan?.requires_card &&
    isStarterStylePlan(plan)
  );
}

export function canStartPlanWithoutCard(
  plan?: Pick<Plan, "name" | "trial_days" | "requires_card"> | null,
) {
  return canStartTrialWithoutCard(plan);
}
