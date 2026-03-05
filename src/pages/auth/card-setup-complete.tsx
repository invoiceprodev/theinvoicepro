import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const CardSetupCompletePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing your card setup...");

  useEffect(() => {
    processCardSetup();
  }, []);

  const processCardSetup = async () => {
    try {
      const subscriptionId = searchParams.get("subscription_id");
      const payfastPaymentId = searchParams.get("pf_payment_id");

      if (!subscriptionId) {
        throw new Error("Invalid setup completion. Missing subscription information.");
      }

      // Wait a moment for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if subscription was updated with PayFast token
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("id, status, payfast_token, trial_end_date")
        .eq("id", subscriptionId)
        .single();

      if (error) {
        throw new Error("Failed to verify subscription setup.");
      }

      if (!subscription) {
        throw new Error("Subscription not found.");
      }

      // If we have a PayFast payment ID from the URL, update the subscription
      if (payfastPaymentId && !subscription.payfast_token) {
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            payfast_token: payfastPaymentId,
          })
          .eq("id", subscriptionId);

        if (updateError) {
          console.error("Failed to update PayFast token:", updateError);
        }
      }

      setStatus("success");
      setMessage("Your trial has been activated successfully!");

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to complete card setup. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "processing" && (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === "error" && (
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>

          <CardTitle className="text-2xl">
            {status === "processing" && "Processing..."}
            {status === "success" && "Trial Activated!"}
            {status === "error" && "Setup Issue"}
          </CardTitle>

          <CardDescription>{message}</CardDescription>
        </CardHeader>

        <CardContent>
          {status === "success" && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Your 14-day trial is now active</AlertTitle>
                <AlertDescription className="text-green-700">
                  You have full access to all Trial plan features. Your card will be charged R170.00 after 14 days.
                </AlertDescription>
              </Alert>

              <p className="text-sm text-center text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Failed</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
