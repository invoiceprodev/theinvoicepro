import { mockPlans } from "../data/plans";
import type { Plan } from "../types";

export function shouldUsePlanFallback(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
      ? String(error.message || "")
      : "";

  return /fetch failed|Failed to fetch|network|ENOTFOUND|ECONNREFUSED|timed out/i.test(message);
}

export function getFallbackPlans(): Plan[] {
  return mockPlans.map((plan) => ({ ...plan }));
}
