import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CreditCard, Shield, Lock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CardCollectionStepProps {
  userId: string;
  userEmail: string;
  userName: string;
}

export const CardCollectionStep = ({ userId, userEmail, userName }: CardCollectionStepProps) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionCreated, setSubscriptionCreated] = useState(false);

  // Trial plan details (R170.00 as per Phase 20)
  const TRIAL_PRICE = 170.0;
  const TRIAL_DAYS = 14;
  const CURRENCY = "ZAR";

  useEffect(() => {
    // Check if subscription already exists
    checkExistingSubscription();
  }, [userId]);

  const checkExistingSubscription = async () => {
    try {
      const { data, error } = await supabase.from("subscriptions").select("id, status").eq("user_id", userId).single();

      if (data && !error) {
        setSubscriptionCreated(true);
        // If subscription exists, redirect to dashboard after a moment
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err) {
      // No subscription exists yet, that's fine
    }
  };

  const handleSetupCard = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Get the Trial plan ID
      const { data: trialPlan, error: planError } = await supabase
        .from("plans")
        .select("id, name, price")
        .eq("name", "Trial")
        .single();

      if (planError || !trialPlan) {
        throw new Error("Trial plan not found. Please contact support.");
      }

      // Step 2: Calculate trial dates
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

      // Step 3: Create trial subscription (without token initially)
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_id: trialPlan.id,
          status: "trial",
          start_date: trialStartDate.toISOString().split("T")[0],
          renewal_date: trialEndDate.toISOString().split("T")[0],
          trial_start_date: trialStartDate.toISOString().split("T")[0],
          trial_end_date: trialEndDate.toISOString().split("T")[0],
        })
        .select()
        .single();

      if (subError || !subscription) {
        throw new Error("Failed to create trial subscription.");
      }

      // Step 4: Prepare PayFast subscription data
      const payfastData = generatePayFastSubscriptionData({
        subscriptionId: subscription.id,
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        amount: TRIAL_PRICE,
        planName: trialPlan.name,
        trialDays: TRIAL_DAYS,
      });

      // Step 5: Submit to PayFast for card authorization
      submitToPayFast(payfastData);
    } catch (err: any) {
      setError(err.message || "Failed to set up card authorization. Please try again.");
      setIsProcessing(false);
    }
  };

  const generatePayFastSubscriptionData = ({
    subscriptionId,
    userId,
    userName,
    userEmail,
    amount,
    planName,
    trialDays,
  }: {
    subscriptionId: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    planName: string;
    trialDays: number;
  }) => {
    const merchantId = import.meta.env.VITE_PAYFAST_MERCHANT_ID || "10000100";
    const merchantKey = import.meta.env.VITE_PAYFAST_MERCHANT_KEY || "46f0cd694581a";
    const mode = import.meta.env.VITE_PAYFAST_MODE || "sandbox";

    const baseUrl = window.location.origin;
    const returnUrl = `${baseUrl}/auth/card-setup-complete?subscription_id=${subscriptionId}`;
    const cancelUrl = `${baseUrl}/auth/signup?card_setup=cancelled`;
    const notifyUrl = `${baseUrl}/.netlify/functions/payfast-webhook`;

    // Split name into first and last
    const nameParts = userName.trim().split(" ");
    const firstName = nameParts[0] || userName;
    const lastName = nameParts.slice(1).join(" ") || firstName;

    return {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: firstName,
      name_last: lastName,
      email_address: userEmail,
      m_payment_id: `TRIAL-${subscriptionId}`,
      amount: amount.toFixed(2),
      item_name: `${planName} - 14-Day Trial`,
      item_description: `Trial subscription - Card will be charged R${amount.toFixed(2)} after ${trialDays} days`,
      subscription_type: "1", // Subscription
      billing_date: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Charge after trial
      recurring_amount: amount.toFixed(2),
      frequency: "3", // Monthly
      cycles: "0", // Indefinite
      custom_str1: subscriptionId, // Store subscription ID
      custom_str2: userId, // Store user ID
      custom_int1: 2, // Flag: 2 = trial subscription
      email_confirmation: 1,
      confirmation_address: userEmail,
    };
  };

  const submitToPayFast = (data: any) => {
    const payfastUrl =
      import.meta.env.VITE_PAYFAST_MODE === "live"
        ? "https://www.payfast.co.za/eng/process"
        : "https://sandbox.payfast.co.za/eng/process";

    // Create a form and submit it
    const form = document.createElement("form");
    form.method = "POST";
    form.action = payfastUrl;

    Object.keys(data).forEach((key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = data[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handleSkipForNow = () => {
    // User can skip but will need to add card later
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
            <CardTitle>Setup Complete!</CardTitle>
            <CardDescription>Redirecting you to your dashboard...</CardDescription>
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
            <CardTitle className="text-2xl font-bold text-center">Set Up Your Trial</CardTitle>
            <CardDescription className="text-center">Start your 14-day free trial with full access</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Trial Details */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-lg mb-3">Your 14-Day Free Trial Includes:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Up to 5 invoices per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>1 client account</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Basic invoice templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
            </div>

            {/* Pricing Information */}
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm">After Your Trial</p>
                  <p className="text-sm text-muted-foreground">
                    Your card will be charged <strong className="text-foreground">R{TRIAL_PRICE.toFixed(2)}</strong>{" "}
                    after {TRIAL_DAYS} days.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cancel anytime before the trial ends to avoid charges.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 text-xs text-muted-foreground">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Your payment information is securely processed by PayFast. We never store your card details on our
                servers.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button onClick={handleSetupCard} disabled={isProcessing} size="lg" className="w-full">
              {isProcessing ? "Redirecting to PayFast..." : "Set Up Trial & Add Card"}
            </Button>

            <Button onClick={handleSkipForNow} variant="ghost" size="sm" className="w-full" disabled={isProcessing}>
              Skip for now (add card later)
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By clicking "Set Up Trial", you agree to our Terms of Service and authorize us to charge your card after
              the trial period.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
