import type { Plan } from "@/types";

export interface PlanEntitlements {
  maxInvoicesPerMonth: number | null;
  maxSavedClients: number | null;
  maxTeamMembers: number | null;
  unlimitedSavedItems: boolean;
  quotesEnabled: boolean;
  complianceEnabled: boolean;
  recurringStatementsEnabled: boolean;
  removeBranding: boolean;
  customEmails: boolean;
}

function parseCount(feature: string, matcher: RegExp) {
  const match = feature.match(matcher);
  return match ? Number(match[1]) : null;
}

export function getPlanEntitlements(plan?: Plan | null): PlanEntitlements {
  const features = plan?.features || [];

  const maxInvoicesPerMonth =
    features.some((feature) => /unlimited invoices/i.test(feature))
      ? null
      : features.map((feature) => parseCount(feature, /(\d+)\s+Invoices?\s*\/\s*Month/i)).find((value) => value != null) ?? null;

  const maxSavedClients =
    features.some((feature) => /unlimited saved clients/i.test(feature))
      ? null
      : features.map((feature) => parseCount(feature, /(\d+)\s+Saved Clients/i)).find((value) => value != null) ?? null;

  const maxTeamMembers =
    features.some((feature) => /unlimited team members/i.test(feature))
      ? null
      : features.map((feature) => parseCount(feature, /(\d+)\s+Team Members/i)).find((value) => value != null) ?? null;

  return {
    maxInvoicesPerMonth,
    maxSavedClients,
    maxTeamMembers,
    unlimitedSavedItems: features.some((feature) => /unlimited saved items/i.test(feature)),
    quotesEnabled: features.some((feature) => /quotes/i.test(feature)),
    complianceEnabled: features.some((feature) => /expenses\s*&\s*compliance/i.test(feature)),
    recurringStatementsEnabled: features.some((feature) => /recurring statements/i.test(feature)),
    removeBranding: features.some((feature) => /remove branding/i.test(feature)),
    customEmails: features.some((feature) => /custom emails/i.test(feature)),
  };
}
