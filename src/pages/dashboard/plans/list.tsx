import { useList } from "@refinedev/core";
import { useNavigate } from "react-router";
import type { Plan, Subscription, Profile } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { mockPlans } from "@/data/plans";

// Plan hierarchy: lower index = lower tier
const PLAN_HIERARCHY: string[] = ["Trial", "Starter", "Pro", "Enterprise"];

function getPlanRank(planName: string): number {
  const idx = PLAN_HIERARCHY.findIndex((n) => n.toLowerCase() === planName?.toLowerCase());
  return idx === -1 ? 0 : idx;
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  Trial: "Perfect for testing our platform",
  Starter: "Ideal for small businesses",
  Pro: "Best for growing businesses",
  Enterprise: "Complete solution for large teams",
};

export default function PlansListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch all plans sorted by price
  const { query: plansQuery } = useList<Plan>({
    resource: "plans",
    pagination: { mode: "off" },
    sorters: [{ field: "price", order: "asc" }],
  });

  // Fetch current user's active subscription
  const { query: subscriptionsQuery } = useList<Subscription>({
    resource: "subscriptions",
    filters: [{ field: "user_id", operator: "eq", value: user?.id }],
    pagination: { mode: "off" },
    queryOptions: { enabled: !!user?.id },
  });

  const plansFromSupabase = plansQuery.data?.data || [];
  // Fall back to mock plans if Supabase returned nothing
  const plans: Plan[] = plansFromSupabase.length > 0 ? plansFromSupabase : mockPlans;
  const activeSubscription = subscriptionsQuery.data?.data?.find(
    (s: Subscription) => s.status === "active" || s.status === "trial",
  );

  const isLoading = plansQuery.isLoading || subscriptionsQuery.isLoading;

  // Determine current plan name — fall back to "Starter" if no real data
  const currentPlanId = activeSubscription?.plan_id;
  const currentPlan = plans.find((p: Plan) => p.id === currentPlanId);
  const currentPlanName: string = currentPlan?.name ?? "Starter";
  const currentRank = getPlanRank(currentPlanName);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  // Sort plans by hierarchy order
  const sortedPlans = [...plans].sort((a, b) => getPlanRank(a.name) - getPlanRank(b.name));

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Select the perfect plan for your business. Upgrade or downgrade anytime.
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-sm px-3 py-1">
              Current Plan:{" "}
              <span className="font-semibold ml-1">
                {currentPlanName}
                {activeSubscription?.status === "trial" && " (Trial)"}
              </span>
            </Badge>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {sortedPlans.map((plan: Plan) => {
            const planRank = getPlanRank(plan.name);
            const isCurrentPlan = plan.name.toLowerCase() === currentPlanName.toLowerCase();
            const isUpgrade = planRank > currentRank;
            const isDowngrade = planRank < currentRank;
            const isPopular = plan.name.toLowerCase() === "pro";

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col transition-all duration-200",
                  isCurrentPlan && "border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10",
                  isPopular && !isCurrentPlan && "border-2 border-violet-400",
                  !isCurrentPlan && !isPopular && "border border-border hover:border-muted-foreground/40",
                )}>
                {/* Badges */}
                {isPopular && !isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-3">
                    <Zap className="h-3 w-3 mr-1" /> Most Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3">
                    ✓ Your Plan
                  </Badge>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {PLAN_DESCRIPTIONS[plan.name] ?? `${plan.name} plan`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pt-0">
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-muted-foreground text-sm">/{plan.billing_cycle}</span>
                    </div>
                    {plan.name === "Trial" && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">14-day free trial</p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0 mt-0.5",
                              isCurrentPlan ? "text-primary" : "text-emerald-500",
                            )}
                          />
                          <span className="text-sm leading-snug">{feature}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-sm">All {plan.name} features</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-sm">24/7 Support</span>
                        </li>
                      </>
                    )}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  {isCurrentPlan ? (
                    <Button className="w-full cursor-default" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                      onClick={() => navigate("/plans")}>
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  ) : isDowngrade ? (
                    <Button className="w-full" variant="outline" onClick={() => navigate("/plans")}>
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Downgrade
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">All plans include secure payment processing via PayFast.</p>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
