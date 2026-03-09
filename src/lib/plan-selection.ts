import type { Plan } from "@/types";

const STORAGE_KEY = "selected_plan_checkout";

export interface SelectedPlanCheckout {
  id: string;
  name: string;
  features?: string[];
  price: number;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  trial_days?: number;
  requires_card?: boolean;
  auto_renew?: boolean;
  description?: string;
}

export function setSelectedPlanCheckout(plan: Plan) {
  if (typeof window === "undefined") return;

  const payload: SelectedPlanCheckout = {
    id: plan.id,
    name: plan.name,
    features: plan.features,
    price: Number(plan.price),
    currency: plan.currency,
    billing_cycle: plan.billing_cycle,
    trial_days: plan.trial_days,
    requires_card: plan.requires_card,
    auto_renew: plan.auto_renew,
    description: plan.description,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getSelectedPlanCheckout(): SelectedPlanCheckout | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SelectedPlanCheckout;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSelectedPlanCheckout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasSelectedPlanCheckout() {
  return Boolean(getSelectedPlanCheckout());
}
