import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function CardSetupSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing your card setup...");

  useEffect(() => {
    const processCardSetup = async () => {
      try {
        const userId = searchParams.get("user_id");
        const subscriptionId = searchParams.get("subscription_id");
        const payfastToken = searchParams.get("token"); // PayFast subscription token

        if (!userId || !subscriptionId) {
          setStatus("error");
          setMessage("Invalid card setup data. Please try again.");
          return;
        }

        // Update subscription with PayFast token
        const { error } = await supabase
          .from("subscriptions")
          .update({
            payfast_token: payfastToken || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscriptionId);

        if (error) {
          console.error("Error updating subscription:", error);
          setStatus("error");
          setMessage("Failed to save card details. Please contact support.");
          return;
        }

        setStatus("success");
        setMessage("Your card has been successfully added!");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } catch (error) {
        console.error("Error processing card setup:", error);
        setStatus("error");
        setMessage("An error occurred. Please try again.");
      }
    };

    processCardSetup();
  }, [searchParams, navigate]);

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
                  <li>• Your 14-day free trial starts now</li>
                  <li>• You'll be charged R170.00 after the trial</li>
                  <li>• Cancel anytime before the trial ends</li>
                </ul>
              </div>

              <p className="text-center text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          )}

          {status === "error" && (
            <Button onClick={() => navigate("/auth/signup")} className="w-full">
              Return to Sign Up
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
