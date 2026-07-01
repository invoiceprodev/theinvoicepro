import { mockPlans } from "../data/plans";
import type { Plan } from "../types";

export function shouldUsePlanFallback(error: unknown) {
  if (error instanceof Error) {
    return /fetch failed|Failed to fetch|network|ENOTFOUND|ECONNREFUSED|timed out/i.test(error.message);
  }

  return false;
}

export function getFallbackPlans(): Plan[] {
  return mockPlans.map((plan) => ({ ...plan }));
}
