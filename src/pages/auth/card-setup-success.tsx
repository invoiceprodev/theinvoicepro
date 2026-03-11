import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { clearSelectedPlanCheckout, getSelectedPlanCheckout } from "@/lib/plan-selection";
import { setSubscriptionBridgeSnapshot } from "@/lib/subscription-bridge";
import { getCurrentSubscriptionState, type Subscription } from "@/types";

export default function CardSetupSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing your card setup...");

  const trialDays = Number(searchParams.get("trial_days") || 0);
  const amount = Number(searchParams.get("amount") || 0);
  const planName = searchParams.get("plan_name") || "selected";

  useEffect(() => {
    const processCardSetup = async () => {
      try {
        const subscriptionId = searchParams.get("subscription_id");
        const payfastToken = searchParams.get("token") || searchParams.get("pf_payment_id");
        const paystackReference = searchParams.get("reference");
        const provider = (searchParams.get("provider") || import.meta.env.VITE_PAYMENT_PROVIDER || "payfast").toLowerCase();
        const selectedPlan = getSelectedPlanCheckout();

        if (!subscriptionId) {
          setStatus("error");
          setMessage("Invalid card setup data. Please try again.");
          return;
        }

        if (provider === "paystack") {
          if (!paystackReference) {
            setStatus("error");
            setMessage("Missing Paystack reference. Please try again.");
            return;
          }

          await apiRequest(`/subscriptions/${subscriptionId}/paystack-verify`, {
            method: "POST",
            body: JSON.stringify({
              reference: paystackReference,
              planId: selectedPlan?.id || searchParams.get("plan_id") || null,
            }),
          });
        } else {
          await apiRequest(`/subscriptions/${subscriptionId}/payfast-token`, {
            method: "POST",
            body: JSON.stringify({
              payfastToken: payfastToken || null,
              planId: selectedPlan?.id || null,
            }),
          });
        }

        const currentSubscription = await apiRequest<{ data: Subscription | null }>("/subscription/current");

        if (!currentSubscription.data?.id || currentSubscription.data.id !== subscriptionId) {
          setStatus("error");
          setMessage("Card setup completed, but the subscription could not be confirmed yet. Please refresh and try again.");
          return;
        }

        if (getCurrentSubscriptionState(currentSubscription.data) === "trial_pending") {
          setStatus("error");
          setMessage("Your billing setup is not confirmed yet. Please wait a moment and try again.");
          return;
        }

        clearSelectedPlanCheckout();
        setSubscriptionBridgeSnapshot({
          isLoading: false,
          subscription: currentSubscription.data,
        });
        setStatus("success");
        setMessage("Your card has been successfully added and your subscription trial is active.");

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } catch (error) {
        console.error("Error processing card setup:", error);
        setStatus("error");
        setMessage("An error occurred while saving your card setup. Please try again.");
      }
    };

    void processCardSetup();
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
              <CardTitle>Processing...</CardTitle>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Success!</CardTitle>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Error</CardTitle>
            </>
          )}

          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>

        <CardContent>
          {status === "success" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                <p className="font-semibold">What happens next?</p>
                <ul className="mt-2 space-y-1">
                  <li>• Your {planName} subscription trial starts now</li>
                  {trialDays > 0 && <li>• No charge now. Your first charge is after {trialDays} days</li>}
                  {amount > 0 && (
                    <li>
                      • Renewal amount: R{amount.toFixed(2)}
                    </li>
                  )}
                  <li>• Cancel anytime before the trial ends</li>
                </ul>
              </div>

              <p className="text-center text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          )}

          {status === "error" && (
            <Button onClick={() => navigate("/dashboard/plans")} className="w-full">
              Return to Plans
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
