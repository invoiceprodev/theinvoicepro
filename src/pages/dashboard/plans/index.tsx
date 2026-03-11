import React, { useMemo, useState } from "react";
import { useList, useNotification } from "@refinedev/core";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, CreditCard, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentSubscriptionState, type Plan } from "@/types";
import { apiRequest } from "@/lib/api-client";
import { clearSelectedPlanCheckout, setSelectedPlanCheckout } from "@/lib/plan-selection";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import { setSubscriptionBridgeSnapshot } from "@/lib/subscription-bridge";
import { canStartTrialWithoutCard, planRequiresCard } from "@/lib/trial-bypass";

type DialogState =
  | { open: false }
  | {
      open: true;
      plan: Plan;
    };

function getPlanPriority(plan: Plan) {
  const name = plan.name.toLowerCase();
  if (name.includes("starter") || name.includes("trial") || name === "basic") return 0;
  if (name === "pro") return 1;
  if (name === "enterprise") return 2;
  return 10;
}

function getPlanCta(plan: Plan) {
  if ((plan.trial_days || 0) > 0) {
    return "Start Trial";
  }
  return "Buy Plan";
}

export function PlansPage() {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [processing, setProcessing] = useState(false);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState<"cancel" | "change" | "start" | null>(null);
  const { open: openNotification } = useNotification();
  const { loading: subscriptionLoading, subscription, state: subscriptionState } = useSubscriptionState();
  const paymentProvider = (import.meta.env.VITE_PAYMENT_PROVIDER || "paystack").toLowerCase();
  const paymentProviderLabel = paymentProvider === "paystack" ? "Paystack" : "PayFast";

  const { result, query } = useList<Plan>({
    resource: "plans",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    pagination: { mode: "off" },
  });

  const plans = useMemo(() => {
    const source = (result?.data as Plan[]) || [];
    return [...source].sort((a, b) => getPlanPriority(a) - getPlanPriority(b) || a.price - b.price);
  }, [result?.data]);
  const plansErrorMessage =
    query.error instanceof Error ? query.error.message : "Failed to load subscription plans from the live catalog.";
  const hasSavedPaymentMethod = Boolean(subscription?.payfast_token || subscription?.paystack_authorization_code);

  function openPlanDialog(plan: Plan) {
    setSelectedPlanCheckout(plan);
    setDialog({ open: true, plan });
  }

  function closeDialog() {
    clearSelectedPlanCheckout();
    setDialog({ open: false });
  }

  function handleConfirm() {
    if (!dialog.open) return;
    setProcessing(true);

    window.setTimeout(() => {
      setProcessing(false);
      setDialog({ open: false });
      if (planRequiresCard(dialog.plan)) {
        navigate("/auth/card-setup");
        return;
      }
      clearSelectedPlanCheckout();
      openNotification?.({
        type: "success",
        message: (dialog.plan.trial_days || 0) > 0 ? `Trial ready for ${dialog.plan.name}` : `${dialog.plan.name} selected`,
        description:
          (dialog.plan.trial_days || 0) > 0
            ? `Your ${dialog.plan.trial_days}-day trial is ready and can start without card setup.`
            : `The ${dialog.plan.name} plan has been selected.`,
      });
    }, 800);
  }

  async function handleCancelAutoRenew() {
    setSubscriptionActionLoading("cancel");

    try {
      const response = await apiRequest<{ data: any }>("/subscription/cancel-auto-renew", {
        method: "POST",
      });

      setSubscriptionBridgeSnapshot({
        isLoading: false,
        subscription: response.data,
      });

      openNotification?.({
        type: "success",
        message: "Plan cancelled",
        description: "Your access stays active until the current term ends. No refund will be issued.",
      });
    } catch (error) {
      openNotification?.({
        type: "error",
        message: "Action failed",
        description: error instanceof Error ? error.message : "Failed to cancel auto-renew.",
      });
    } finally {
      setSubscriptionActionLoading(null);
    }
  }

  async function handleChangePlan(plan: Plan) {
    setSubscriptionActionLoading("change");

    try {
      const response = await apiRequest<{ data: any }>("/subscription/change-plan", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id }),
      });

      setSubscriptionBridgeSnapshot({
        isLoading: false,
        subscription: response.data,
      });
      clearSelectedPlanCheckout();

      openNotification?.({
        type: "success",
        message: "Plan changed",
        description: `Your subscription has been updated to ${plan.name}.`,
      });
    } catch (error) {
      openNotification?.({
        type: "error",
        message: "Plan change failed",
        description: error instanceof Error ? error.message : "Failed to change plan.",
      });
    } finally {
      setSubscriptionActionLoading(null);
    }
  }

  async function handleStartTrialWithoutCard(plan: Plan) {
    setSubscriptionActionLoading("start");

    try {
      const trialResponse = await apiRequest<{ data: { subscription: any } }>("/subscriptions/trial-setup", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id }),
      });

      clearSelectedPlanCheckout();
      setSubscriptionBridgeSnapshot({
        isLoading: false,
        subscription: {
          ...trialResponse.data.subscription,
          plan,
        },
      });

      openNotification?.({
        type: "success",
        message: "Trial started",
        description: `${plan.name} is now active without card setup.`,
      });
    } catch (error) {
      openNotification?.({
        type: "error",
        message: "Trial start failed",
        description: error instanceof Error ? error.message : "Failed to start trial.",
      });
    } finally {
      setSubscriptionActionLoading(null);
    }
  }

  function handleManagePaymentMethod() {
    if (!subscription?.plan) {
      openNotification?.({
        type: "error",
        message: "Payment setup unavailable",
        description: "No current plan was found for this subscription.",
      });
      return;
    }

    setSelectedPlanCheckout(subscription.plan);
    navigate("/auth/card-setup");
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-base text-muted-foreground">
          Plans are managed from admin and reflected here automatically. Starter/Trial starts with a 60-day trial, while
          Pro and Enterprise continue through {paymentProviderLabel} card setup.
        </p>
      </div>

      {!subscriptionLoading && subscription ? (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl">Current Subscription</CardTitle>
              <CardDescription>
                {subscription.plan?.name || "Active plan"} • {subscriptionState.replace("_", " ")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleManagePaymentMethod} disabled={!subscription.plan}>
              {hasSavedPaymentMethod ? "Update Payment Method" : "Set Up Card"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {subscriptionState === "trial_pending" ? (
              <p>Your subscription record exists, but card setup is still incomplete. Complete setup to activate the plan.</p>
            ) : null}
            {subscriptionState === "trial_active" ? (
              <p>
                Your trial is active{subscription.trial_end_date ? ` until ${new Date(subscription.trial_end_date).toLocaleDateString()}` : ""}.
              </p>
            ) : null}
            {subscriptionState === "active" ? (
              <p>
                Your subscription is active{subscription.renewal_date ? ` and renews on ${new Date(subscription.renewal_date).toLocaleDateString()}` : ""}.
              </p>
            ) : null}
            {subscriptionState === "cancelled" ? <p>Your subscription has been cancelled.</p> : null}
            {subscriptionState === "expired" ? <p>Your subscription has expired. Choose a plan to resume access.</p> : null}
            {subscription?.auto_renew === false ? (
              <p className="font-medium text-foreground">
                Your plan has been cancelled and will end at the end of the current term.
              </p>
            ) : (
              <p>Your plan will keep renewing automatically until you cancel it.</p>
            )}
            {(subscriptionState === "trial_active" || subscriptionState === "active") && subscription?.auto_renew !== false ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelAutoRenew}
                disabled={subscriptionActionLoading !== null}>
                {subscriptionActionLoading === "cancel" ? "Cancelling..." : "Cancel Plan"}
              </Button>
            ) : null}
            {subscriptionState === "trial_pending" ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth/card-setup")}>
                Continue Card Setup
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {query.isLoading ? (
        <p className="text-center text-sm text-muted-foreground">Loading admin-managed plans...</p>
      ) : query.isError ? (
        <Card className="border-destructive/30">
          <CardContent className="py-8 text-center">
            <p className="font-medium">Unable to load subscription plans.</p>
            <p className="mt-2 text-sm text-muted-foreground">{plansErrorMessage}</p>
          </CardContent>
        </Card>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">No active plans available.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The live plan catalog is empty right now. Add or activate plans from admin pricing.
            </p>
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const trialDays = Number(plan.trial_days || 0);
          const isPopular = !!(plan.is_popular || plan.isPopular);
          const requiresCard = planRequiresCard(plan);
          const autoRenew = !!plan.auto_renew;
          const isCurrentPlan = subscription?.plan_id === plan.id && getCurrentSubscriptionState(subscription) !== "expired";

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-shadow",
                isPopular && "border-primary shadow-md",
              )}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {trialDays > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {trialDays}-day trial
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description || "Professional invoicing plan"}</CardDescription>
                <div>
                  <span className="text-3xl font-bold">
                    {plan.currency === "ZAR" ? "R" : `${plan.currency} `}
                    {Number(plan.price).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground"> / {plan.billing_cycle}</span>
                </div>
                {requiresCard && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    Card required via {paymentProviderLabel}.
                    {trialDays > 0 && autoRenew
                      ? ` Starts with a ${trialDays}-day trial, then auto-renews unless cancelled before renewal.`
                      : ""}
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-5">
                <ul className="flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {trialDays > 0 && <li className="text-sm text-muted-foreground">Includes a {trialDays}-day free trial.</li>}
                </ul>

                  <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => {
                    if (!subscription && canStartTrialWithoutCard(plan)) {
                      void handleStartTrialWithoutCard(plan);
                      return;
                    }
                    if (!subscription && planRequiresCard(plan)) {
                      setSelectedPlanCheckout(plan);
                      navigate("/auth/card-setup");
                      return;
                    }
                    if (subscription && !isCurrentPlan && subscriptionState !== "trial_pending") {
                      if (planRequiresCard(plan)) {
                        setSelectedPlanCheckout(plan);
                        navigate("/auth/card-setup");
                        return;
                      }
                      void handleChangePlan(plan);
                      return;
                    }
                    openPlanDialog(plan);
                  }}
                  disabled={isCurrentPlan || subscriptionActionLoading !== null}>
                  {isCurrentPlan
                    ? "Current Plan"
                    : subscription
                      ? subscriptionActionLoading === "change"
                        ? "Updating..."
                        : "Change Plan"
                      : subscriptionActionLoading === "start" && canStartTrialWithoutCard(plan)
                        ? "Starting trial..."
                        : getPlanCta(plan)}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {dialog.open && (
        <Dialog open={dialog.open} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{getPlanCta(dialog.plan)} {dialog.plan.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{dialog.plan.name}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">
                    {dialog.plan.currency === "ZAR" ? "R" : `${dialog.plan.currency} `}
                    {Number(dialog.plan.price).toFixed(2)} / {dialog.plan.billing_cycle}
                  </span>
                </div>
                {(dialog.plan.trial_days || 0) > 0 && (
                  <div className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">Trial</span>
                    <span className="font-medium">{dialog.plan.trial_days} days</span>
                  </div>
                )}
              </div>

              {planRequiresCard(dialog.plan) ? (
                <>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card required to {getPlanCta(dialog.plan).toLowerCase()}
                    </p>
                    <p className="mt-1">
                      {dialog.plan.trial_days
                        ? `Your card will be authorised now and charged only after ${dialog.plan.trial_days} days.`
                        : `Your card will be collected now and used for recurring billing through ${paymentProviderLabel}.`}
                    </p>
                    {dialog.plan.auto_renew && dialog.plan.trial_days ? (
                      <p className="mt-1">This subscription auto-renews unless you cancel before the trial ends.</p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You will be redirected to secure {paymentProviderLabel} checkout to complete card setup for this plan.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By continuing, you authorise {paymentProviderLabel} to auto-renew this plan
                      {dialog.plan.trial_days ? ` after ${dialog.plan.trial_days} days` : ""}.
                    </p>
                  </div>
                </>
              ) : (dialog.plan.trial_days || 0) > 0 ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                  <p className="font-semibold">No card required to start this trial</p>
                  <p className="mt-1">
                    Your {dialog.plan.trial_days}-day trial will begin immediately. You can add billing details later when
                    you upgrade to a card-required plan.
                  </p>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={processing}>
                {processing ? "Processing..." : getPlanCta(dialog.plan)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
