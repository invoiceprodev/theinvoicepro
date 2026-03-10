import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CreditCard, Shield, Lock, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import type { Plan, Subscription } from "@/types";
import { clearSelectedPlanCheckout } from "@/lib/plan-selection";
import { setSubscriptionBridgeSnapshot } from "@/lib/subscription-bridge";
import { canStartTrialWithoutCard } from "@/lib/trial-bypass";

interface CardCollectionStepProps {
  userId: string;
  userEmail: string;
  userName: string;
  plan: Plan;
}

export const CardCollectionStep = ({ userId, userEmail, userName, plan }: CardCollectionStepProps) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionCreated, setSubscriptionCreated] = useState(false);
  const [debugPayload, setDebugPayload] = useState<Record<string, string | boolean> | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  const showPayFastDebug = import.meta.env.DEV;
  const allowTrialBypass = canStartTrialWithoutCard(plan);

  const trialDays = Number(plan.trial_days || 0);
  const amount = Number(plan.price || 0);

  const createSubscription = async () => {
    const response = await apiRequest<{ data: { subscription: Subscription; plan: Plan; existing: boolean } }>(
      "/subscriptions/trial-setup",
      {
        method: "POST",
        body: JSON.stringify({ planId: plan.id }),
      },
    );

    const subscription = response.data.subscription;
    if (!subscription?.id) {
      throw new Error("Failed to create trial subscription.");
    }

    return subscription;
  };

  const handleSetupCard = async () => {
    setIsProcessing(true);
    setError(null);
    setDebugUrl(null);

    try {
      const subscription = await createSubscription();

      setSubscriptionCreated(true);

      const payment = await apiRequest<{
        data: {
          url: string;
          debug: Record<string, string | boolean>;
        };
      }>(`/subscriptions/${subscription.id}/payfast-checkout`, {
        method: "POST",
      });

      if (showPayFastDebug) {
        setDebugPayload(payment.data.debug);
        console.table(payment.data.debug);
      }

      window.location.href = payment.data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to set up card authorization. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleActivateTrialBypass = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const subscription = await createSubscription();

      clearSelectedPlanCheckout();
      setSubscriptionBridgeSnapshot({
        isLoading: false,
        subscription: {
          ...subscription,
          plan,
        },
      });

      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to activate your trial. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInspectPayload = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const subscription = await createSubscription();

      const debugResponse = await apiRequest<{
        data: {
          debug: Record<string, string | boolean>;
          url: string;
        };
      }>(`/subscriptions/${subscription.id}/payfast-debug`);

      setDebugPayload(debugResponse.data.debug);
      setDebugUrl(debugResponse.data.url);
      console.table(debugResponse.data.debug);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to inspect PayFast payload.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipForNow = () => {
    navigate("/dashboard");
  };

  if (subscriptionCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-4 py-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle>Redirecting to PayFast</CardTitle>
            <CardDescription>We are opening secure card setup for your {plan.name} plan.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 justify-center mb-2">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Start {plan.name}</CardTitle>
            <CardDescription className="text-center">
              {trialDays > 0 ? `Start your ${trialDays}-day free trial with card authorisation` : "Set up recurring billing"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-lg mb-3">{plan.name} includes:</h3>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Billing Summary</p>
                  {trialDays > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        No charge today. Your card is authorised now and billed{" "}
                        <strong className="text-foreground">
                          {plan.currency === "ZAR" ? "R" : `${plan.currency} `}
                          {amount.toFixed(2)}
                        </strong>{" "}
                        after {trialDays} days if you do not cancel.
                      </p>
                      {plan.auto_renew && (
                        <p className="text-xs text-muted-foreground mt-2">This trial auto-renews through PayFast after the trial period.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your card will be used for recurring billing of{" "}
                      <strong className="text-foreground">
                        {plan.currency === "ZAR" ? "R" : `${plan.currency} `}
                        {amount.toFixed(2)}
                      </strong>{" "}
                      per {plan.billing_cycle}.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {allowTrialBypass && trialDays > 0 ? (
              <Alert>
                <AlertTitle>No card required for this trial</AlertTitle>
                <AlertDescription>
                  Starter/Trial can begin immediately without card setup. The PayFast flow remains available below if you
                  still want to attach billing details now.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-start gap-3 text-xs text-muted-foreground">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Your payment information is securely processed by PayFast. We never store your card details on our servers.</p>
            </div>

            {showPayFastDebug && debugPayload ? (
              <div className="rounded-lg border bg-muted/40 p-4 text-xs">
                <p className="font-semibold text-foreground mb-2">PayFast debug payload</p>
                <div className="grid gap-1 text-muted-foreground">
                  {Object.entries(debugPayload).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <span className="font-mono text-[11px] text-foreground">{key}</span>
                      <span className="text-right break-all">{String(value)}</span>
                    </div>
                  ))}
                </div>
                {debugUrl ? (
                  <div className="mt-3 break-all border-t pt-3">
                    <p className="font-semibold text-foreground mb-1">Checkout URL</p>
                    <p className="text-muted-foreground">{debugUrl}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            {allowTrialBypass && trialDays > 0 ? (
              <Button onClick={handleActivateTrialBypass} disabled={isProcessing} size="lg" className="w-full">
                {isProcessing ? "Starting trial..." : "Start Trial"}
              </Button>
            ) : null}

            <Button onClick={handleSetupCard} disabled={isProcessing} size="lg" className="w-full">
              {isProcessing ? "Redirecting to PayFast..." : trialDays > 0 ? "Start Trial With Card" : "Continue to PayFast"}
            </Button>

            {showPayFastDebug ? (
              <Button onClick={handleInspectPayload} variant="outline" size="sm" className="w-full" disabled={isProcessing}>
                Inspect PayFast Payload
              </Button>
            ) : null}

            <Button onClick={handleSkipForNow} variant="ghost" size="sm" className="w-full" disabled={isProcessing}>
              Skip for now
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you authorise PayFast to set up recurring billing
              {trialDays > 0 ? ` after your ${trialDays}-day trial` : ""}.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
