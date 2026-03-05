import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

/**
 * Trial Conversion Cron Job - Netlify Function
 * Scheduled endpoint: /.netlify/functions/trial-conversion-cron
 *
 * This function should be called daily to:
 * 1. Process expired trials and convert to paid subscriptions
 * 2. Send 3-day trial ending reminder emails
 *
 * Configure in Netlify: Site Settings > Build & Deploy > Environment Variables
 * Add scheduled trigger via Netlify's Scheduled Functions or external cron service
 */

// Helper types
interface TrialConversionResult {
  success: boolean;
  subscriptionId: string;
  userId: string;
  message: string;
  paymentId?: string;
  error?: string;
}

interface TrialConversionSummary {
  totalProcessed: number;
  successfulConversions: number;
  failedConversions: number;
  results: TrialConversionResult[];
}

interface EmailReminderSummary {
  totalProcessed: number;
  remindersSent: number;
  remindersFailed: number;
}

/**
 * Initialize Supabase client with server environment variables
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_API_URL;
  const supabaseKey = process.env.VITE_SUPABASE_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Process all expired trials
 */
async function processAllExpiredTrials(supabase: any): Promise<TrialConversionSummary> {
  console.log("[Trial Conversion Cron] Starting batch processing");

  const now = new Date().toISOString();

  // Find expired trials
  const { data: expiredTrials, error } = await supabase
    .from("subscriptions")
    .select("*, plan:plans(*)")
    .eq("status", "trial")
    .eq("auto_renew", true)
    .lte("trial_end_date", now)
    .order("trial_end_date", { ascending: true });

  if (error) {
    console.error("[Trial Conversion Cron] Error finding trials:", error);
    throw error;
  }

  if (!expiredTrials || expiredTrials.length === 0) {
    console.log("[Trial Conversion Cron] No expired trials found");
    return {
      totalProcessed: 0,
      successfulConversions: 0,
      failedConversions: 0,
      results: [],
    };
  }

  console.log(`[Trial Conversion Cron] Processing ${expiredTrials.length} trials`);

  // Get Starter plan
  const { data: starterPlan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("name", "Starter")
    .eq("is_active", true)
    .single();

  if (planError || !starterPlan) {
    throw new Error("Starter plan not found");
  }

  const results: TrialConversionResult[] = [];

  // Process each trial
  for (const subscription of expiredTrials) {
    try {
      console.log(`[Trial Conversion Cron] Processing subscription ${subscription.id}`);

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          amount: starterPlan.price,
          currency: "ZAR",
          payment_method: "payfast",
          status: "completed", // Auto-mark as completed for trial conversion
          transaction_reference: `TRIAL_CONV_${subscription.id}_${Date.now()}`,
        })
        .select()
        .single();

      if (paymentError) {
        console.error(`[Trial Conversion Cron] Payment creation failed:`, paymentError);

        // Mark as expired
        await supabase.from("subscriptions").update({ status: "expired" }).eq("id", subscription.id);

        results.push({
          success: false,
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          message: "Payment creation failed",
          error: paymentError.message,
        });

        continue;
      }

      // Activate subscription
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + 30);

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          plan_id: starterPlan.id,
          renewal_date: renewalDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (updateError) {
        console.error(`[Trial Conversion Cron] Activation failed:`, updateError);

        results.push({
          success: false,
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          message: "Activation failed after payment",
          paymentId: payment.id,
          error: updateError.message,
        });

        continue;
      }

      // Create history record
      await supabase.from("subscription_history").insert({
        subscription_id: subscription.id,
        user_id: subscription.user_id,
        new_plan_id: starterPlan.id,
        new_status: "active",
        action_type: "upgraded",
        notes: "Trial converted to Starter plan via auto-subscription",
        changed_at: new Date().toISOString(),
      });

      results.push({
        success: true,
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        message: `Successfully converted to Starter plan (R${starterPlan.price})`,
        paymentId: payment.id,
      });

      console.log(`[Trial Conversion Cron] Success: ${subscription.id}`);
    } catch (err) {
      console.error(`[Trial Conversion Cron] Error processing ${subscription.id}:`, err);

      results.push({
        success: false,
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        message: "Unexpected error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Small delay between processing
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const successfulConversions = results.filter((r) => r.success).length;
  const failedConversions = results.filter((r) => !r.success).length;

  console.log(`[Trial Conversion Cron] Complete: ${successfulConversions} successful, ${failedConversions} failed`);

  return {
    totalProcessed: expiredTrials.length,
    successfulConversions,
    failedConversions,
    results,
  };
}

/**
 * Process 3-day trial reminders
 */
async function processTrialReminders(supabase: any): Promise<EmailReminderSummary> {
  console.log("[Trial Email Reminders] Starting reminder processing");

  // Calculate date range for 3 days from now
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  threeDaysFromNow.setHours(23, 59, 59, 999);

  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 3);
  twoDaysFromNow.setHours(0, 0, 0, 0);

  // Find trials that need 3-day reminder
  const { data: subscriptionsNeedingReminder, error } = await supabase
    .from("subscriptions")
    .select("*, plan:plans(*), profile:profiles(*)")
    .eq("status", "trial")
    .eq("auto_renew", true)
    .gte("trial_end_date", twoDaysFromNow.toISOString())
    .lte("trial_end_date", threeDaysFromNow.toISOString())
    .is("reminder_sent_at", null);

  if (error) {
    console.error("[Trial Email Reminders] Error finding subscriptions:", error);
    return {
      totalProcessed: 0,
      remindersSent: 0,
      remindersFailed: 0,
    };
  }

  if (!subscriptionsNeedingReminder || subscriptionsNeedingReminder.length === 0) {
    console.log("[Trial Email Reminders] No subscriptions need reminders");
    return {
      totalProcessed: 0,
      remindersSent: 0,
      remindersFailed: 0,
    };
  }

  console.log(`[Trial Email Reminders] Processing ${subscriptionsNeedingReminder.length} reminders`);

  let remindersSent = 0;
  let remindersFailed = 0;

  // Process each subscription
  for (const subscription of subscriptionsNeedingReminder) {
    try {
      // Send email via EmailJS
      const emailSent = await sendReminderEmail(subscription);

      if (emailSent) {
        // Mark reminder as sent
        await supabase
          .from("subscriptions")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", subscription.id);

        remindersSent++;
        console.log(`[Trial Email Reminders] Sent reminder for subscription ${subscription.id}`);
      } else {
        remindersFailed++;
        console.warn(`[Trial Email Reminders] Failed to send reminder for subscription ${subscription.id}`);
      }
    } catch (err) {
      console.error(`[Trial Email Reminders] Error sending reminder for ${subscription.id}:`, err);
      remindersFailed++;
    }

    // Small delay between emails
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`[Trial Email Reminders] Complete: ${remindersSent} sent, ${remindersFailed} failed`);

  return {
    totalProcessed: subscriptionsNeedingReminder.length,
    remindersSent,
    remindersFailed,
  };
}

/**
 * Send reminder email using EmailJS
 */
async function sendReminderEmail(subscription: any): Promise<boolean> {
  try {
    const emailJsServiceId = process.env.VITE_EMAILJS_SERVICE_ID;
    const emailJsTemplateId = process.env.VITE_EMAILJS_TEMPLATE_ID;
    const emailJsPublicKey = process.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!emailJsServiceId || !emailJsTemplateId || !emailJsPublicKey) {
      console.warn("[Trial Email Reminders] EmailJS not configured");
      return false;
    }

    const profile = subscription.profile;
    const plan = subscription.plan;

    if (!profile?.business_email) {
      console.warn(`[Trial Email Reminders] No email for subscription ${subscription.id}`);
      return false;
    }

    const trialEndDate = new Date(subscription.trial_end_date);
    const formattedEndDate = trialEndDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const daysRemaining = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Send email via EmailJS REST API
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
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
          subject: `Your Trial Ends in ${daysRemaining} Days`,
          email_type: "trial_reminder",
          trial_plan_name: plan.name,
          trial_price: `R${plan.price.toFixed(2)}`,
          trial_end_date: formattedEndDate,
          days_remaining: daysRemaining.toString(),
          business_name: profile.company_name || "Online Invoicing System",
          user_name: profile.full_name || "User",
          message: `Your ${plan.name} trial is ending soon! You have ${daysRemaining} days remaining. On ${formattedEndDate}, your trial will convert to the Starter plan at R${plan.price.toFixed(2)}/month. To avoid being charged, you can cancel anytime before the trial ends.`,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[Trial Email Reminders] Error in sendReminderEmail:", error);
    return false;
  }
}

/**
 * Netlify Function Handler
 */
const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  console.log("[Trial Conversion Cron] Function invoked");

  // Security: Verify request authorization (optional but recommended)
  const authHeader = event.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[Trial Conversion Cron] Unauthorized request");
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    // Initialize Supabase client
    const supabase = getSupabaseClient();

    // Process trial reminders (3-day warnings)
    const emailSummary = await processTrialReminders(supabase);

    // Process expired trials
    const conversionSummary = await processAllExpiredTrials(supabase);

    // Return summary
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Trial conversion and email processing complete",
        summary: {
          conversions: {
            totalProcessed: conversionSummary.totalProcessed,
            successfulConversions: conversionSummary.successfulConversions,
            failedConversions: conversionSummary.failedConversions,
          },
          emailReminders: {
            totalProcessed: emailSummary.totalProcessed,
            remindersSent: emailSummary.remindersSent,
            remindersFailed: emailSummary.remindersFailed,
          },
          timestamp: new Date().toISOString(),
        },
        // Include detailed results only if there are failures
        ...(conversionSummary.failedConversions > 0 && {
          failedConversions: conversionSummary.results.filter((r) => !r.success),
        }),
      }),
    };
  } catch (error) {
    console.error("[Trial Conversion Cron] Fatal error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

export { handler };
