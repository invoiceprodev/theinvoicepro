export type PublicPlanFallback = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: string;
  status: string;
  features: string[];
  trial_days: number;
  requires_card: boolean;
  auto_renew: boolean;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const publicPlanFallbacks: PublicPlanFallback[] = [
  {
    id: "starter-trial",
    name: "Starter/Trial",
    description: "For freelancers and small businesses",
    price: 150,
    currency: "ZAR",
    billing_cycle: "monthly",
    status: "Active",
    features: [
      "150 Invoices / Quotes / Month",
      "50 Saved Clients",
      "5 Team Members",
      "Unlimited Saved Items",
      "Expenses & Compliance tracking",
      "PDF Export",
      "Custom Emails",
    ],
    trial_days: 60,
    requires_card: false,
    auto_renew: true,
    is_popular: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    price: 320,
    currency: "ZAR",
    billing_cycle: "monthly",
    status: "Active",
    features: [
      "250 Invoices / Quotes / Month",
      "100 Saved Clients",
      "5 Team Members",
      "Unlimited Saved Items",
      "Expenses & Compliance Tracking",
      "Recurring Statements",
      "PDF Export",
      "Remove Branding",
      "Custom Emails",
    ],
    trial_days: 0,
    requires_card: true,
    auto_renew: true,
    is_popular: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large teams and organizations",
    price: 480,
    currency: "ZAR",
    billing_cycle: "monthly",
    status: "Active",
    features: [
      "Unlimited Invoices / Quotes / Month",
      "Unlimited Saved Clients",
      "10 Team Members",
      "Unlimited Saved Items",
      "Expenses & Compliance Tracking",
      "Recurring Statements",
      "PDF Export",
      "Remove Branding",
      "Custom Emails",
    ],
    trial_days: 0,
    requires_card: true,
    auto_renew: true,
    is_popular: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function isSupabaseConnectivityError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message || "";
  return /fetch failed|ENOTFOUND|ECONNREFUSED|timed out|network/i.test(message);
}

export function getFallbackPlanById(id: string) {
  return publicPlanFallbacks.find((plan) => plan.id === id) ?? null;
}
