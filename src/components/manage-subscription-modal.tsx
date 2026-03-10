import { useState } from "react";
import { useList, useUpdate, useNotification } from "@refinedev/core";
import type { Subscription, Plan, Profile, SubscriptionHistory, Payment } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Loader2,
  ArrowRight,
  History as HistoryIcon,
  XCircle,
  CheckCircle,
  Clock,
  CreditCard as CreditCardIcon,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManageSubscriptionModalProps {
  subscription: Subscription;
  currentPlan: Plan;
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function to format action type for display
function formatActionType(actionType: string): string {
  const map: Record<string, string> = {
    created: "Created",
    plan_changed: "Plan Changed",
    status_changed: "Status Changed",
    cancelled: "Cancelled",
    upgraded: "Upgraded",
    downgraded: "Downgraded",
  };
  return map[actionType] || actionType;
}

// Helper function to get badge variant based on action type
function getActionBadgeVariant(actionType: string): "default" | "secondary" | "destructive" | "outline" {
  switch (actionType) {
    case "created":
      return "default";
    case "plan_changed":
    case "upgraded":
    case "downgraded":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function formatPlanAmount(plan?: Plan | null) {
  if (!plan) return "N/A";
  if (plan.currency && plan.currency !== "ZAR") {
    return `${plan.currency} ${Number(plan.price || 0).toFixed(2)}`;
  }
  return formatCurrency(Number(plan.price || 0));
}

export function ManageSubscriptionModal({
  subscription,
  currentPlan,
  profile,
  open,
  onOpenChange,
}: ManageSubscriptionModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [quickAction, setQuickAction] = useState<{
    type: "cancel" | "reactivate" | "extend-trial";
    days?: number;
  } | null>(null);
  const { open: openNotification } = useNotification();

  // Fetch all available plans
  const {
    result: plansResult,
    query: { isLoading: plansLoading },
  } = useList<Plan>({
    resource: "plans",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    pagination: { pageSize: 100 },
  });

  const plans = plansResult.data ?? [];

  // Fetch subscription history
  const {
    result: historyResult,
    query: { isLoading: historyLoading },
  } = useList<SubscriptionHistory>({
    resource: "subscription_history",
    filters: [{ field: "subscription_id", operator: "eq", value: subscription.id }],
    sorters: [{ field: "changed_at", order: "desc" }],
    pagination: { pageSize: 10 },
    meta: {
      select:
        "*, old_plan:plans!old_plan_id(name, price, billing_cycle), new_plan:plans!new_plan_id(name, price, billing_cycle)",
    },
  });

  const history = historyResult.data ?? [];

  // Fetch payment history for this subscription
  const {
    result: paymentsResult,
    query: { isLoading: paymentsLoading },
  } = useList<Payment>({
    resource: "payments",
    filters: [{ field: "subscription_id", operator: "eq", value: subscription.id }],
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 20 },
  });

  const payments = paymentsResult.data ?? [];

  // Update subscription mutation
  const { mutate: updateSubscription } = useUpdate();

  const selectedPlan = plans.find((p: Plan) => p.id === selectedPlanId);

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan.id) {
      openNotification?.({
        type: "error",
        message: "Invalid Selection",
        description: "Client is already on this plan",
      });
      return;
    }
    setSelectedPlanId(planId);
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = () => {
    if (!selectedPlanId || !selectedPlan) return;

    // Calculate new renewal date (30 days from now for monthly, 365 for yearly)
    const renewalDate = new Date();
    if (selectedPlan.billing_cycle === "monthly") {
      renewalDate.setDate(renewalDate.getDate() + 30);
    } else {
      renewalDate.setDate(renewalDate.getDate() + 365);
    }

    setIsUpdating(true);

    updateSubscription(
      {
        resource: "subscriptions",
        id: subscription.id,
        values: {
          plan_id: selectedPlanId,
          status: "active",
          renewal_date: renewalDate.toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          setIsUpdating(false);
          openNotification?.({
            type: "success",
            message: "Subscription Updated",
            description: `${profile.full_name || "Client"}'s subscription has been changed to ${selectedPlan.name}`,
          });
          onOpenChange(false);
          setShowConfirmation(false);
          setSelectedPlanId(null);
        },
        onError: (error) => {
          setIsUpdating(false);
          openNotification?.({
            type: "error",
            message: "Update Failed",
            description: error.message || "Failed to update subscription. Please try again.",
          });
        },
      },
    );
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedPlanId(null);
  };

  const handleQuickActionConfirm = () => {
    if (!quickAction) return;

    const { type, days } = quickAction;
    let values: Partial<Subscription> = {};
    let successMessage = "";

    switch (type) {
      case "cancel":
        values = { status: "cancelled", updated_at: new Date().toISOString() };
        successMessage = "Subscription cancelled successfully";
        break;
      case "reactivate":
        values = { status: "active", updated_at: new Date().toISOString() };
        successMessage = "Subscription reactivated successfully";
        break;
      case "extend-trial":
        if (days && subscription.trial_end_date) {
          const trialEndDate = new Date(subscription.trial_end_date);
          trialEndDate.setDate(trialEndDate.getDate() + days);
          values = {
            trial_end_date: trialEndDate.toISOString(),
            renewal_date: trialEndDate.toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          };
          successMessage = `Trial extended by ${days} days`;
        }
        break;
    }

    setIsUpdating(true);

    updateSubscription(
      {
        resource: "subscriptions",
        id: subscription.id,
        values,
      },
      {
        onSuccess: () => {
          setIsUpdating(false);
          openNotification?.({
            type: "success",
            message: "Success",
            description: successMessage,
          });
          setQuickAction(null);
          onOpenChange(false);
        },
        onError: (error) => {
          setIsUpdating(false);
          openNotification?.({
            type: "error",
            message: "Action Failed",
            description: error.message || "Failed to update subscription",
          });
        },
      },
    );
  };

  const isActive = subscription.status === "active";
  const isTrial = subscription.status === "trial";
  const isCancelled = subscription.status === "cancelled";
  const isExpired = subscription.status === "expired";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showConfirmation ? "Confirm Plan Change" : "Manage Subscription"}</DialogTitle>
            <DialogDescription>
              {showConfirmation
                ? "Please review the changes before confirming"
                : `Update subscription plan for ${profile.full_name}`}
            </DialogDescription>
          </DialogHeader>

          {!showConfirmation ? (
            <Tabs defaultValue="manage" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="manage">Change Plan</TabsTrigger>
                <TabsTrigger value="history">
                  <HistoryIcon className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger value="payments">
                  <Wallet className="h-4 w-4 mr-2" />
                  Payments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manage" className="space-y-6 mt-6">
                {/* Quick Actions Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(isActive || isTrial) && (
                      <Button
                        variant="outline"
                        className="justify-start border-destructive/50 hover:bg-destructive/10"
                        onClick={() => setQuickAction({ type: "cancel" })}
                        disabled={isUpdating}>
                        <XCircle className="h-4 w-4 mr-2 text-destructive" />
                        Cancel Subscription
                      </Button>
                    )}

                    {(isCancelled || isExpired) && (
                      <Button
                        variant="outline"
                        className="justify-start border-green-500/50 hover:bg-green-500/10"
                        onClick={() => setQuickAction({ type: "reactivate" })}
                        disabled={isUpdating}>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Reactivate Subscription
                      </Button>
                    )}

                    {isTrial && (
                      <>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => setQuickAction({ type: "extend-trial", days: 7 })}
                          disabled={isUpdating}>
                          <Clock className="h-4 w-4 mr-2" />
                          Extend Trial +7 days
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => setQuickAction({ type: "extend-trial", days: 14 })}
                          disabled={isUpdating}>
                          <Clock className="h-4 w-4 mr-2" />
                          Extend Trial +14 days
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => setQuickAction({ type: "extend-trial", days: 30 })}
                          disabled={isUpdating}>
                          <Clock className="h-4 w-4 mr-2" />
                          Extend Trial +30 days
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Current Plan */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Current Plan</h3>
                  <Card className="border-2 border-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{currentPlan.name}</CardTitle>
                        <Badge>Current</Badge>
                      </div>
                      <CardDescription>
                        {formatPlanAmount(currentPlan)} / {currentPlan.billing_cycle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {currentPlan.features?.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Available Plans */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Available Plans</h3>
                  {plansLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plans
                        .filter((plan: Plan) => plan.id !== currentPlan.id)
                        .map((plan: Plan) => (
                          <Card key={plan.id} className="hover:border-primary transition-colors">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              <CardDescription>
                                {formatPlanAmount(plan)} / {plan.billing_cycle}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <div className="space-y-2">
                                {plan.features?.slice(0, 4).map((feature: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2 text-sm">
                                    <Check className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleSelectPlan(plan.id)}
                                disabled={isUpdating}>
                                Select Plan
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Subscription History</h3>
                  <Badge variant="outline">{history.length} changes</Badge>
                </div>

                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-muted-foreground">
                        <HistoryIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No subscription history found</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {history.map((item: SubscriptionHistory, idx: number) => (
                      <Card key={item.id} className="relative">
                        {idx < history.length - 1 && <div className="absolute left-6 top-full h-3 w-0.5 bg-border" />}
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <HistoryIcon className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant={getActionBadgeVariant(item.action_type)}>
                                  {formatActionType(item.action_type)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.changed_at).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {item.action_type === "created" ? (
                                <p className="text-sm">
                                  Subscription created with{" "}
                                  <span className="font-semibold">{item.new_plan?.name || "plan"}</span>
                                </p>
                              ) : item.action_type === "plan_changed" ? (
                                <div className="flex items-center gap-2 text-sm flex-wrap">
                                  <span className="font-semibold">{item.old_plan?.name || "Previous plan"}</span>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="font-semibold">{item.new_plan?.name || "New plan"}</span>
                                  {item.old_plan && item.new_plan && (
                                    <span className="text-muted-foreground ml-2">
                                      ({formatPlanAmount(item.old_plan)} → {formatPlanAmount(item.new_plan)})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <p>
                                    Status changed: <span className="font-semibold capitalize">{item.old_status}</span>
                                    <ArrowRight className="h-3 w-3 inline mx-1" />
                                    <span className="font-semibold capitalize">{item.new_status}</span>
                                  </p>
                                </div>
                              )}

                              {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Payment History</h3>
                  <Badge variant="outline">{payments.length} payments</Badge>
                </div>

                {paymentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : payments.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-muted-foreground">
                        <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No payment history found</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment: Payment) => {
                      const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                        completed: "default",
                        pending: "secondary",
                        failed: "destructive",
                      };

                      return (
                        <Card key={payment.id}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <CreditCardIcon className="h-5 w-5 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={statusVariant[payment.status] || "outline"}>
                                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                    </Badge>
                                    <span className="text-sm font-semibold">
                                      {payment.currency && payment.currency !== "ZAR"
                                        ? `${payment.currency} ${Number(payment.amount || 0).toFixed(2)}`
                                        : formatCurrency(Number(payment.amount || 0))}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(payment.created_at).toLocaleDateString(undefined, {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>

                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Payment Method:</span>
                                    <span className="font-medium capitalize">{payment.payment_method}</span>
                                  </div>

                                  {payment.transaction_reference && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">Transaction ID:</span>
                                      <span className="font-mono text-xs">{payment.transaction_reference}</span>
                                    </div>
                                  )}

                                  {payment.payfast_payment_id && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">PayFast ID:</span>
                                      <span className="font-mono text-xs">{payment.payfast_payment_id}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            // Confirmation Step
            <div className="space-y-6">
              <Alert>
                <AlertDescription>
                  You are about to change this subscription. Please review the details below.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Current Plan</h4>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{currentPlan.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {formatPlanAmount(currentPlan)} / {currentPlan.billing_cycle}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">New Plan</h4>
                  <Card className="border-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{selectedPlan?.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {formatPlanAmount(selectedPlan)} / {selectedPlan?.billing_cycle}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Subscription status will be set to "Active"</p>
                <p>• New renewal date will be calculated based on the billing cycle</p>
                <p>• Client will be notified of the plan change</p>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmUpdate} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Confirm Update"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Action Confirmation Dialog */}
      <AlertDialog open={!!quickAction} onOpenChange={(open) => !open && setQuickAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {quickAction?.type === "cancel" && "Cancel Subscription"}
              {quickAction?.type === "reactivate" && "Reactivate Subscription"}
              {quickAction?.type === "extend-trial" && "Extend Trial Period"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {quickAction?.type === "cancel" &&
                `This will cancel ${profile.full_name}'s subscription. They will lose access at the end of their billing period. This action can be undone by reactivating.`}
              {quickAction?.type === "reactivate" &&
                `This will reactivate ${profile.full_name}'s subscription and restore their access. The renewal date will remain unchanged.`}
              {quickAction?.type === "extend-trial" &&
                `This will extend ${profile.full_name}'s trial period by ${quickAction?.days} days. The renewal date will be updated accordingly.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleQuickActionConfirm}
              disabled={isUpdating}
              className={quickAction?.type === "cancel" ? "bg-destructive hover:bg-destructive/90" : ""}>
              {isUpdating ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
