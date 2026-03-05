import { useList, useUpdate } from "@refinedev/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Subscription } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { format, differenceInDays, parseISO } from "date-fns";
import { AlertCircle, CreditCard, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router";

export const TrialCountdownWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's subscription
  const { result: subscriptionResult, query: subscriptionQuery } = useList<Subscription>({
    resource: "subscriptions",
    filters: [
      { field: "user_id", operator: "eq", value: user?.id },
      { field: "status", operator: "eq", value: "trial" },
    ],
    pagination: { pageSize: 1 },
    meta: {
      select: "*, plan:plans(*)",
    },
  });

  const { mutate: updateSubscription, mutation } = useUpdate();

  const subscription = subscriptionResult?.data?.[0];

  // Don't show widget if not loading and no trial subscription
  if (!subscriptionQuery.isLoading && !subscription) {
    return null;
  }

  // Show loading state
  if (subscriptionQuery.isLoading) {
    return null;
  }

  // Calculate days remaining
  const trialEndDate = subscription.trial_end_date ? parseISO(subscription.trial_end_date) : null;
  const today = new Date();
  const daysRemaining = trialEndDate ? differenceInDays(trialEndDate, today) : 0;
  const trialStartDate = subscription.trial_start_date ? parseISO(subscription.trial_start_date) : null;
  const totalTrialDays = trialStartDate && trialEndDate ? differenceInDays(trialEndDate, trialStartDate) : 14;
  const daysElapsed = totalTrialDays - daysRemaining;
  const progressPercentage = (daysElapsed / totalTrialDays) * 100;

  // Handle cancel trial
  const handleCancelTrial = () => {
    if (!subscription?.id) return;

    updateSubscription(
      {
        resource: "subscriptions",
        id: subscription.id,
        values: {
          auto_renew: false,
        },
      },
      {
        onSuccess: () => {
          console.log("Trial auto-renewal cancelled successfully");
        },
        onError: (error) => {
          console.error("Failed to cancel trial:", error);
        },
      },
    );
  };

  // Handle upgrade now
  const handleUpgradeNow = () => {
    navigate("/dashboard/plans");
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              Trial Period Active
            </CardTitle>
            <CardDescription>Your 14-day free trial is in progress</CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            Trial
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Days Remaining */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{daysRemaining}</span>
              <span className="ml-2 text-muted-foreground">days left in your trial</span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            Trial ends on {trialEndDate ? format(trialEndDate, "MMMM dd, yyyy") : "N/A"}
          </p>
        </div>

        {/* Payment Notice */}
        {subscription.auto_renew !== false && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-400">
              <strong>Your card will be charged R170.00</strong> on{" "}
              {trialEndDate ? format(trialEndDate, "MMMM dd, yyyy") : "N/A"} to continue with the Starter plan.
            </AlertDescription>
          </Alert>
        )}

        {subscription.auto_renew === false && (
          <Alert className="border-gray-200 bg-gray-50 dark:bg-gray-950/20">
            <X className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-sm text-gray-700 dark:text-gray-400">
              <strong>Auto-renewal cancelled.</strong> Your trial will end on{" "}
              {trialEndDate ? format(trialEndDate, "MMMM dd, yyyy") : "N/A"} and you won't be charged.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button size="lg" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleUpgradeNow}>
            Upgrade Now
          </Button>
          {subscription.auto_renew !== false && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              onClick={handleCancelTrial}
              disabled={mutation.isPending}>
              {mutation.isPending ? "Cancelling..." : "Cancel Trial"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
