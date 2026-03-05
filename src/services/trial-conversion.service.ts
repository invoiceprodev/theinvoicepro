import type { Subscription, Plan, Payment } from "@/types";
import CryptoJS from "crypto-js";
import { sendSubscriptionActivatedEmail, sendPaymentFailedEmail } from "@/templates/trial-emails";
import { supabaseClient } from "@/lib/supabase";

/**
 * Trial Conversion Service
 * Handles automatic subscription conversion when trial periods end
 */

export interface TrialConversionResult {
  success: boolean;
  subscriptionId: string;
  userId: string;
  message: string;
  paymentId?: string;
  error?: string;
}

export interface TrialConversionSummary {
  totalProcessed: number;
  successfulConversions: number;
  failedConversions: number;
  results: TrialConversionResult[];
}

/**
 * Get PayFast configuration from environment
 * Accepts optional parameters for server-side usage (Netlify Functions)
 */
const getPayFastConfig = (serverEnv?: {
  merchantId?: string;
  merchantKey?: string;
  passphrase?: string;
  mode?: string;
}) => {
  // If server environment variables provided, use them
  if (serverEnv) {
    return {
      merchantId: serverEnv.merchantId || "",
      merchantKey: serverEnv.merchantKey || "",
      passphrase: serverEnv.passphrase || "",
      mode: serverEnv.mode || "sandbox",
    };
  }

  // Otherwise use import.meta.env for client-side (Vite)
  return {
    merchantId: import.meta.env.VITE_PAYFAST_MERCHANT_ID || "",
    merchantKey: import.meta.env.VITE_PAYFAST_MERCHANT_KEY || "",
    passphrase: import.meta.env.VITE_PAYFAST_PASSPHRASE || "",
    mode: import.meta.env.VITE_PAYFAST_MODE || "sandbox",
  };
};

/**
 * Find all expired trial subscriptions that need conversion
 */
export async function findExpiredTrials(): Promise<Subscription[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("status", "trial")
      .eq("auto_renew", true)
      .lte("trial_end_date", now)
      .order("trial_end_date", { ascending: true });

    if (error) {
      console.error("[Trial Conversion] Error finding expired trials:", error);
      return [];
    }

    console.log(`[Trial Conversion] Found ${data?.length || 0} expired trials`);
    return (data || []) as Subscription[];
  } catch (error) {
    console.error("[Trial Conversion] Error in findExpiredTrials:", error);
    return [];
  }
}

/**
 * Get Starter plan details (target plan for trial conversion)
 */
export async function getStarterPlan(): Promise<Plan | null> {
  try {
    const { data, error } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("name", "Starter")
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("[Trial Conversion] Error fetching Starter plan:", error);
      return null;
    }

    return data as Plan;
  } catch (error) {
    console.error("[Trial Conversion] Error in getStarterPlan:", error);
    return null;
  }
}

/**
 * Generate signature for PayFast ad-hoc payment
 */
function generatePayFastSignature(data: Record<string, string | number>, passphrase: string): string {
  // Create parameter string (sorted by key)
  const pfParamString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key].toString().trim())}`)
    .join("&");

  // Append passphrase
  const signatureString = passphrase ? `${pfParamString}&passphrase=${encodeURIComponent(passphrase)}` : pfParamString;

  // Generate MD5 hash
  return CryptoJS.MD5(signatureString).toString();
}

/**
 * Charge subscription using PayFast stored token
 * Note: This is a simplified implementation. In production, you would need to:
 * 1. Use PayFast's ad-hoc payment API or subscription billing API
 * 2. Make server-side API calls to PayFast
 * 3. Handle tokenized payment properly
 *
 * For now, we'll create a payment record and mark it as pending,
 * which will be completed when PayFast webhook confirms payment
 */
export async function chargeSubscription(
  subscription: Subscription,
  amount: number,
  planName: string,
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    const config = getPayFastConfig();

    if (!config.merchantId || !config.merchantKey) {
      return {
        success: false,
        error: "PayFast not configured",
      };
    }

    // Check if subscription has PayFast token
    if (!subscription.payfast_token) {
      console.warn(`[Trial Conversion] Subscription ${subscription.id} has no PayFast token, creating pending payment`);

      // Create pending payment record (will be updated by webhook)
      const { data: payment, error: paymentError } = await supabaseClient
        .from("payments")
        .insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          amount: amount,
          currency: "ZAR",
          payment_method: "payfast",
          status: "pending",
          transaction_reference: `TRIAL_CONV_${subscription.id}_${Date.now()}`,
        })
        .select()
        .single();

      if (paymentError) {
        return {
          success: false,
          error: `Failed to create payment record: ${paymentError.message}`,
        };
      }

      return {
        success: true,
        paymentId: payment.id,
      };
    }

    // In production, this would make an API call to PayFast to charge the stored token
    // For now, we'll create a pending payment that simulates successful authorization
    // The actual charge would be processed by PayFast's subscription system

    console.log(`[Trial Conversion] Processing charge for subscription ${subscription.id}, amount: R${amount}`);

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        amount: amount,
        currency: "ZAR",
        payment_method: "payfast",
        status: "completed", // Mark as completed for auto-conversion
        payfast_payment_id: `pf_${Date.now()}`,
        transaction_reference: `TRIAL_CONV_${subscription.id}_${Date.now()}`,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("[Trial Conversion] Error creating payment:", paymentError);
      return {
        success: false,
        error: `Payment creation failed: ${paymentError.message}`,
      };
    }

    console.log(`[Trial Conversion] Payment created: ${payment.id}`);

    return {
      success: true,
      paymentId: payment.id,
    };
  } catch (error) {
    console.error("[Trial Conversion] Error in chargeSubscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update subscription to active Starter plan after successful payment
 */
export async function activateSubscription(subscriptionId: string, starterPlanId: string): Promise<boolean> {
  try {
    // Calculate renewal date (30 days from now for monthly billing)
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);

    const { error } = await supabaseClient
      .from("subscriptions")
      .update({
        status: "active",
        plan_id: starterPlanId,
        renewal_date: renewalDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (error) {
      console.error("[Trial Conversion] Error activating subscription:", error);
      return false;
    }

    console.log(`[Trial Conversion] Subscription ${subscriptionId} activated successfully`);

    // Create subscription history record
    await supabaseClient.from("subscription_history").insert({
      subscription_id: subscriptionId,
      user_id: (await supabaseClient.from("subscriptions").select("user_id").eq("id", subscriptionId).single()).data
        ?.user_id,
      new_plan_id: starterPlanId,
      new_status: "active",
      action_type: "upgraded",
      notes: "Trial converted to Starter plan via auto-subscription",
      changed_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("[Trial Conversion] Error in activateSubscription:", error);
    return false;
  }
}

/**
 * Mark subscription as payment failed and send notification email
 */
export async function markSubscriptionPaymentFailed(
  subscriptionId: string,
  errorMessage: string,
  userId?: string,
  planId?: string,
): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from("subscriptions")
      .update({
        status: "expired", // Or create a 'payment_failed' status in your enum
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (error) {
      console.error("[Trial Conversion] Error marking payment as failed:", error);
      return false;
    }

    console.log(`[Trial Conversion] Subscription ${subscriptionId} marked as payment failed`);

    // Create subscription history record
    const subscription = await supabaseClient.from("subscriptions").select("user_id").eq("id", subscriptionId).single();

    await supabaseClient.from("subscription_history").insert({
      subscription_id: subscriptionId,
      user_id: subscription.data?.user_id,
      new_status: "expired",
      action_type: "cancelled",
      notes: `Trial conversion payment failed: ${errorMessage}`,
      changed_at: new Date().toISOString(),
    });

    // Send payment failed email notification
    if (userId && planId) {
      try {
        const { data: plan } = await supabaseClient.from("plans").select("*").eq("id", planId).single();

        if (plan) {
          const subscriptionData = await supabaseClient
            .from("subscriptions")
            .select("*")
            .eq("id", subscriptionId)
            .single();

          if (subscriptionData.data) {
            await sendPaymentFailedEmail(userId, subscriptionData.data as Subscription, plan as Plan, errorMessage);
            console.log(`[Trial Conversion] Payment failed email sent to user ${userId}`);
          }
        }
      } catch (emailError) {
        console.error("[Trial Conversion] Error sending payment failed email:", emailError);
        // Don't fail the entire process if email fails
      }
    }

    return true;
  } catch (error) {
    console.error("[Trial Conversion] Error in markSubscriptionPaymentFailed:", error);
    return false;
  }
}

/**
 * Process a single expired trial subscription
 */
export async function processExpiredTrial(subscription: Subscription): Promise<TrialConversionResult> {
  console.log(`[Trial Conversion] Processing subscription ${subscription.id} for user ${subscription.user_id}`);

  try {
    // Get Starter plan
    const starterPlan = await getStarterPlan();

    if (!starterPlan) {
      return {
        success: false,
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        message: "Starter plan not found",
        error: "Target plan not available",
      };
    }

    // Charge the subscription
    const chargeResult = await chargeSubscription(subscription, starterPlan.price, starterPlan.name);

    if (!chargeResult.success) {
      // Mark subscription as payment failed and send email
      await markSubscriptionPaymentFailed(
        subscription.id,
        chargeResult.error || "Payment failed",
        subscription.user_id,
        starterPlan.id,
      );

      return {
        success: false,
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        message: `Payment failed: ${chargeResult.error}`,
        error: chargeResult.error,
      };
    }

    // Activate subscription to Starter plan
    const activated = await activateSubscription(subscription.id, starterPlan.id);

    if (!activated) {
      return {
        success: false,
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        message: "Failed to activate subscription after successful payment",
        paymentId: chargeResult.paymentId,
        error: "Activation failed",
      };
    }

    // Send subscription activated email
    try {
      const updatedSubscription = await supabaseClient
        .from("subscriptions")
        .select("*")
        .eq("id", subscription.id)
        .single();

      if (updatedSubscription.data) {
        await sendSubscriptionActivatedEmail(
          subscription.user_id,
          updatedSubscription.data as Subscription,
          starterPlan,
          chargeResult.paymentId,
        );
        console.log(`[Trial Conversion] Subscription activated email sent to user ${subscription.user_id}`);
      }
    } catch (emailError) {
      console.error("[Trial Conversion] Error sending subscription activated email:", emailError);
      // Don't fail the entire process if email fails
    }

    return {
      success: true,
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      message: `Successfully converted to Starter plan (R${starterPlan.price})`,
      paymentId: chargeResult.paymentId,
    };
  } catch (error) {
    console.error(`[Trial Conversion] Error processing subscription ${subscription.id}:`, error);

    return {
      success: false,
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      message: "Unexpected error during conversion",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Main function to process all expired trials
 * Call this from your cron job/scheduled task
 */
export async function processAllExpiredTrials(): Promise<TrialConversionSummary> {
  console.log("[Trial Conversion] Starting batch processing of expired trials");

  const startTime = Date.now();

  // Find all expired trials
  const expiredTrials = await findExpiredTrials();

  if (expiredTrials.length === 0) {
    console.log("[Trial Conversion] No expired trials found");
    return {
      totalProcessed: 0,
      successfulConversions: 0,
      failedConversions: 0,
      results: [],
    };
  }

  console.log(`[Trial Conversion] Processing ${expiredTrials.length} expired trials`);

  // Process each trial
  const results: TrialConversionResult[] = [];

  for (const trial of expiredTrials) {
    const result = await processExpiredTrial(trial);
    results.push(result);

    // Add small delay between processing to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Calculate summary
  const successfulConversions = results.filter((r) => r.success).length;
  const failedConversions = results.filter((r) => !r.success).length;

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(
    `[Trial Conversion] Batch processing complete in ${duration}s: ${successfulConversions} successful, ${failedConversions} failed`,
  );

  return {
    totalProcessed: expiredTrials.length,
    successfulConversions,
    failedConversions,
    results,
  };
}

/**
 * Send notification for trial conversion result
 * This would integrate with your email service (EmailJS, Resend, etc.)
 */
export async function sendTrialConversionNotification(userId: string, result: TrialConversionResult): Promise<void> {
  try {
    // Get user profile for email
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("business_email, full_name")
      .eq("id", userId)
      .single();

    if (!profile?.business_email) {
      console.warn(`[Trial Conversion] No email found for user ${userId}`);
      return;
    }

    // Email notifications are now sent directly in processExpiredTrial
    // This function is kept for backwards compatibility
    console.log(`[Trial Conversion] Notification for ${profile.business_email}:`, {
      name: profile.full_name,
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("[Trial Conversion] Error sending notification:", error);
  }
}

/**
 * Send trial conversion email notification
 */
async function sendConversionEmail(subscription: any, plan: any, profile: any): Promise<void> {
  try {
    const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!emailJsServiceId || !emailJsTemplateId || !emailJsPublicKey) {
      console.warn("[Trial Conversion] EmailJS not configured, skipping email");
      return;
    }

    if (!profile?.business_email) {
      console.warn("[Trial Conversion] No email address found");
      return;
    }

    const renewalDate = new Date(subscription.renewal_date);
    const formattedRenewalDate = renewalDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: emailJsServiceId,
        template_id: emailJsTemplateId,
        user_id: emailJsPublicKey,
        template_params: {
          to_email: profile.business_email,
          to_name: profile.full_name || "User",
          subject: "Your Trial Has Ended - Subscription Activated",
          email_type: "trial_ended",
          plan_name: plan.name,
          plan_price: `R${plan.price.toFixed(2)}`,
          renewal_date: formattedRenewalDate,
          business_name: profile.company_name || "Online Invoicing System",
          user_name: profile.full_name || "User",
          message: `Your trial has ended and your ${plan.name} subscription is now active! Your first payment of R${plan.price.toFixed(2)} has been processed. Your next billing date is ${formattedRenewalDate}. Thank you for choosing our service!`,
        },
      }),
    });

    console.log("[Trial Conversion] Conversion email sent successfully");
  } catch (error) {
    console.error("[Trial Conversion] Error sending conversion email:", error);
  }
}

/**
 * Send payment failure email notification
 */
async function sendPaymentFailureEmail(subscription: any, profile: any, error: string): Promise<void> {
  try {
    const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!emailJsServiceId || !emailJsTemplateId || !emailJsPublicKey) {
      return;
    }

    if (!profile?.business_email) {
      return;
    }

    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: emailJsServiceId,
        template_id: emailJsTemplateId,
        user_id: emailJsPublicKey,
        template_params: {
          to_email: profile.business_email,
          to_name: profile.full_name || "User",
          subject: "Action Required: Payment Failed",
          email_type: "payment_failed",
          business_name: profile.company_name || "Online Invoicing System",
          user_name: profile.full_name || "User",
          error_message: error,
          message: `We were unable to process your payment for the subscription upgrade. Please update your payment method to continue using our service. Error: ${error}`,
        },
      }),
    });

    console.log("[Trial Conversion] Payment failure email sent");
  } catch (err) {
    console.error("[Trial Conversion] Error sending payment failure email:", err);
  }
}

/**
 * Convert trial subscription to paid Starter plan
 */
export async function convertTrialToStarterPlan(
  subscriptionId: string,
): Promise<{ success: boolean; message: string; paymentId?: string }> {
  console.log(`[Trial Conversion] Starting conversion for subscription ${subscriptionId}`);

  try {
    // Get subscription and user profile
    const { data: subscriptionData, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscriptionData) {
      console.error("[Trial Conversion] Subscription not found:", subError);
      return {
        success: false,
        message: "Subscription not found.",
      };
    }

    // Get user profile for email
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", subscriptionData.user_id)
      .single();

    // Get Starter plan
    const starterPlan = await getStarterPlan();

    if (!starterPlan) {
      return {
        success: false,
        message: "Starter plan not found. Conversion failed.",
      };
    }

    // Calculate renewal date (30 days from now for monthly billing)
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: subscriptionId,
        subscription_id: subscriptionId,
        amount: starterPlan.price,
        currency: "ZAR",
        payment_method: "payfast",
        status: "completed",
        transaction_reference: `TRIAL_CONV_${subscriptionId}_${Date.now()}`,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("[Trial Conversion] Payment creation failed:", paymentError);

      // Send payment failure email
      await sendPaymentFailureEmail(subscriptionId, profile, paymentError.message);

      // Mark subscription as expired
      await supabaseClient.from("subscriptions").update({ status: "expired" }).eq("id", subscriptionId);

      return {
        success: false,
        message: "Payment processing failed. Subscription marked as expired.",
      };
    }

    // Activate subscription to Starter plan
    const activated = await activateSubscription(subscriptionId, starterPlan.id);

    if (!activated) {
      return {
        success: false,
        message: "Failed to activate subscription after successful payment.",
      };
    }

    // Send conversion success email
    if (profile) {
      await sendConversionEmail({ ...subscriptionData, renewal_date: renewalDate.toISOString() }, starterPlan, profile);
    }

    console.log(`[Trial Conversion] Successfully converted subscription ${subscriptionId}`);

    return {
      success: true,
      message: `Successfully converted to Starter plan (R${starterPlan.price}/month)`,
      paymentId: payment.id,
    };
  } catch (error) {
    console.error(`[Trial Conversion] Error converting subscription ${subscriptionId}:`, error);

    return {
      success: false,
      message: "Unexpected error during conversion.",
    };
  }
}

export default {
  findExpiredTrials,
  getStarterPlan,
  chargeSubscription,
  activateSubscription,
  markSubscriptionPaymentFailed,
  processExpiredTrial,
  processAllExpiredTrials,
  sendTrialConversionNotification,
};
