import type { Plan, Subscription } from "@/types";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { RefreshButton } from "@/components/refine-ui/buttons/refresh";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ListView } from "@/components/refine-ui/views/list-view";
import { useUpdate, useList } from "@refinedev/core";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash, Users, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { mockPlans } from "@/data/plans";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock tenant counts by plan name (fallback if Supabase data not available)
const MOCK_TENANT_COUNTS: Record<string, number> = {
  Trial: 24,
  Starter: 58,
  Pro: 31,
  Enterprise: 7,
};

export default function PlanListPage() {
  const { mutate: updatePlan } = useUpdate();

  // Fetch plans from Supabase
  const { query: plansQuery } = useList<Plan>({
    resource: "tiers",
    pagination: { mode: "off" },
  });

  // Fetch all subscriptions to count tenants per plan
  const { query: subscriptionsQuery } = useList<Subscription>({
    resource: "subscriptions",
    pagination: { mode: "off" },
    filters: [{ field: "status", operator: "in", value: ["active", "trial"] }],
  });

  const subscriptions = subscriptionsQuery.data?.data ?? [];

  // Use Supabase data if available, otherwise fall back to mock plans
  const plans: Plan[] =
    plansQuery.data?.data && plansQuery.data.data.length > 0 ? (plansQuery.data.data as Plan[]) : mockPlans;

  const isLoading = plansQuery.isLoading;

  // Build a map of plan_id -> count from real data
  const tenantCountByPlanId = subscriptions.reduce(
    (acc: Record<string, number>, sub: Subscription) => {
      if (sub.plan_id) {
        acc[sub.plan_id] = (acc[sub.plan_id] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const handleToggle = (planId: string, checked: boolean) => {
    updatePlan({
      resource: "tiers",
      id: planId,
      values: { is_active: checked },
      mutationMode: "optimistic",
    });
  };

  return (
    <ListView>
      <div className="flex flex-col gap-4">
        <div className="flex items-center relative gap-2">
          <div className="bg-background z-[2] pr-4">
            <Breadcrumb />
          </div>
          <Separator className="absolute left-0 right-0 z-[1]" />
        </div>
        <div className="flex justify-between gap-4">
          <h2 className="text-2xl font-bold">Pricing Tiers</h2>
          <div className="flex items-center gap-2">
            <RefreshButton resource="tiers" />
            <CreateButton resource="tiers" />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Active Tenants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No pricing tiers found.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => {
                const numPrice = typeof plan.price === "string" ? parseFloat(plan.price) : plan.price;
                const currency = plan.currency || "ZAR";
                const features = plan.features || [];
                const isActive = !!plan.is_active;
                const realCount = tenantCountByPlanId[plan.id];
                const tenantCount = realCount !== undefined ? realCount : (MOCK_TENANT_COUNTS[plan.name] ?? 0);

                return (
                  <TableRow key={plan.id}>
                    {/* Name */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        {plan.isPopular && (
                          <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Popular</Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <span className="font-semibold">
                        {currency === "ZAR" ? formatCurrency(numPrice) : `${currency} ${numPrice.toFixed(2)}`}
                        <span className="text-xs text-muted-foreground font-normal">/mo</span>
                      </span>
                    </TableCell>

                    {/* Billing Cycle */}
                    <TableCell>
                      <Badge variant="outline">{plan.billing_cycle === "monthly" ? "Monthly" : "Yearly"}</Badge>
                    </TableCell>

                    {/* Features */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{features.length} features</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {features.slice(0, 2).join(", ")}
                          {features.length > 2 ? ` +${features.length - 2} more` : ""}
                        </span>
                      </div>
                    </TableCell>

                    {/* Active Tenants */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium tabular-nums">{tenantCount}</span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={isActive} onCheckedChange={(checked) => handleToggle(plan.id, checked)} />
                        <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EditButton resource="tiers" recordItemId={plan.id} size="icon" variant="outline">
                          <Pencil className="h-4 w-4" />
                        </EditButton>
                        <DeleteButton resource="tiers" recordItemId={plan.id} size="icon">
                          <Trash className="h-4 w-4" />
                        </DeleteButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </ListView>
  );
}
