import { sendEmail, isEmailJSConfigured } from "@/lib/emailjs";
import { supabaseClient } from "@/lib/supabase";
import type { Subscription, Plan, Profile } from "@/types";

/**
 * Trial Email Templates
 * Handles all trial lifecycle email notifications
 */

export interface TrialEmailParams {
  userEmail: string;
  userName: string;
  trialEndDate: string;
  planName?: string;
  planPrice?: number;
  businessName?: string;
}

/**
 * Check if trial emails can be sent
 */
export const canSendTrialEmails = (): boolean => {
  return isEmailJSConfigured();
};

/**
 * Get user profile for email
 */
const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabaseClient.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      console.error("[Trial Email] Error fetching user profile:", error);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error("[Trial Email] Error in getUserProfile:", error);
    return null;
  }
};

/**
 * 1. Trial Started - Welcome Email
 * Sent immediately when user signs up for trial
 */
export const sendTrialStartedEmail = async (
  userId: string,
  subscription: Subscription,
  plan: Plan,
): Promise<boolean> => {
  try {
    if (!canSendTrialEmails()) {
      console.warn("[Trial Email] EmailJS not configured, skipping trial started email");
      return false;
    }

    const profile = await getUserProfile(userId);
    if (!profile?.business_email) {
      console.warn(`[Trial Email] No email found for user ${userId}`);
      return false;
    }

    const trialEndDate = new Date(subscription.trial_end_date!);
    const formattedEndDate = trialEndDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const templateParams = {
      to_email: profile.business_email,
      to_name: profile.full_name || "User",
      subject: `Welcome to Your ${plan.name} Trial!`,
      email_type: "trial_started",
      trial_plan_name: plan.name,
      trial_price: `R${plan.price.toFixed(2)}`,
      trial_end_date: formattedEndDate,
      trial_duration: "14 days",
      business_name: profile.company_name || "Online Invoicing System",
      user_name: profile.full_name || "User",
      message: `Welcome to your ${plan.name} trial! Your 14-day free trial has started and will end on ${formattedEndDate}. During your trial, you'll have full access to all features. After the trial period, your subscription will automatically convert to the Starter plan at R${plan.price.toFixed(2)}/month unless you cancel.`,
    };

    await sendEmail(templateParams);
    console.log(`[Trial Email] Trial started email sent to ${profile.business_email}`);
    return true;
  } catch (error) {
    console.error("[Trial Email] Error sending trial started email:", error);
    return false;
  }
};

/**
 * 2. Trial Ending Soon - 3 Days Reminder
 * Sent 3 days before trial ends
 */
export const sendTrialEndingReminderEmail = async (
  userId: string,
  subscription: Subscription,
  plan: Plan,
): Promise<boolean> => {
  try {
    if (!canSendTrialEmails()) {
      console.warn("[Trial Email] EmailJS not configured, skipping trial reminder email");
      return false;
    }

    const profile = await getUserProfile(userId);
    if (!profile?.business_email) {
      console.warn(`[Trial Email] No email found for user ${userId}`);
      return false;
    }

    const trialEndDate = new Date(subscription.trial_end_date!);
    const formattedEndDate = trialEndDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const daysRemaining = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const templateParams = {
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
    };

    await sendEmail(templateParams);
    console.log(`[Trial Email] Trial reminder email sent to ${profile.business_email}`);
    return true;
  } catch (error) {
    console.error("[Trial Email] Error sending trial reminder email:", error);
    return false;
  }
};

/**
 * 3. Trial Ended - Subscription Activated
 * Sent when trial successfully converts to paid subscription
 */
export const sendSubscriptionActivatedEmail = async (
  userId: string,
  subscription: Subscription,
  plan: Plan,
  paymentId?: string,
): Promise<boolean> => {
  try {
    if (!canSendTrialEmails()) {
      console.warn("[Trial Email] EmailJS not configured, skipping subscription activated email");
      return false;
    }

    const profile = await getUserProfile(userId);
    if (!profile?.business_email) {
      console.warn(`[Trial Email] No email found for user ${userId}`);
      return false;
    }

    const renewalDate = new Date(subscription.renewal_date!);
    const formattedRenewalDate = renewalDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const templateParams = {
      to_email: profile.business_email,
      to_name: profile.full_name || "User",
      subject: `Welcome to ${plan.name} Plan!`,
      email_type: "subscription_activated",
      plan_name: plan.name,
      plan_price: `R${plan.price.toFixed(2)}`,
      renewal_date: formattedRenewalDate,
      payment_id: paymentId || "N/A",
      business_name: profile.company_name || "Online Invoicing System",
      user_name: profile.full_name || "User",
      message: `Your trial has ended and your subscription to the ${plan.name} plan is now active! You've been charged R${plan.price.toFixed(2)} for your first month. Your subscription will automatically renew on ${formattedRenewalDate}. Thank you for choosing us!`,
    };

    await sendEmail(templateParams);
    console.log(`[Trial Email] Subscription activated email sent to ${profile.business_email}`);
    return true;
  } catch (error) {
    console.error("[Trial Email] Error sending subscription activated email:", error);
    return false;
  }
};

/**
 * 4. Payment Failed - Action Required
 * Sent when trial conversion payment fails
 */
export const sendPaymentFailedEmail = async (
  userId: string,
  subscription: Subscription,
  plan: Plan,
  errorMessage: string,
): Promise<boolean> => {
  try {
    if (!canSendTrialEmails()) {
      console.warn("[Trial Email] EmailJS not configured, skipping payment failed email");
      return false;
    }

    const profile = await getUserProfile(userId);
    if (!profile?.business_email) {
      console.warn(`[Trial Email] No email found for user ${userId}`);
      return false;
    }

    const templateParams = {
      to_email: profile.business_email,
      to_name: profile.full_name || "User",
      subject: "Action Required: Payment Failed",
      email_type: "payment_failed",
      plan_name: plan.name,
      plan_price: `R${plan.price.toFixed(2)}`,
      error_message: errorMessage,
      business_name: profile.company_name || "Online Invoicing System",
      user_name: profile.full_name || "User",
      message: `We were unable to process your payment for the ${plan.name} plan (R${plan.price.toFixed(2)}/month). Your subscription has been paused. Please update your payment method in your account settings to reactivate your subscription and continue accessing all features.`,
    };

    await sendEmail(templateParams);
    console.log(`[Trial Email] Payment failed email sent to ${profile.business_email}`);
    return true;
  } catch (error) {
    console.error("[Trial Email] Error sending payment failed email:", error);
    return false;
  }
};

/**
 * Check if user should receive 3-day reminder
 * Returns true if trial ends in exactly 3 days and reminder hasn't been sent
 */
export const shouldSendTrialReminder = async (subscription: Subscription): Promise<boolean> => {
  try {
    if (!subscription.trial_end_date) return false;

    const trialEndDate = new Date(subscription.trial_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Send reminder if 3 days remaining and we haven't sent one yet
    // You might want to add a 'reminder_sent' flag to subscriptions table to track this
    return daysRemaining === 3;
  } catch (error) {
    console.error("[Trial Email] Error in shouldSendTrialReminder:", error);
    return false;
  }
};

/**
 * Find subscriptions that need 3-day reminder
 */
export const findSubscriptionsNeedingReminder = async (): Promise<Subscription[]> => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 3);
    twoDaysFromNow.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseClient
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("status", "trial")
      .eq("auto_renew", true)
      .gte("trial_end_date", twoDaysFromNow.toISOString())
      .lte("trial_end_date", threeDaysFromNow.toISOString())
      .is("reminder_sent_at", null); // Only get subscriptions where reminder hasn't been sent

    if (error) {
      console.error("[Trial Email] Error finding subscriptions needing reminder:", error);
      return [];
    }

    return (data || []) as Subscription[];
  } catch (error) {
    console.error("[Trial Email] Error in findSubscriptionsNeedingReminder:", error);
    return [];
  }
};

/**
 * Mark reminder as sent for a subscription
 */
export const markReminderSent = async (subscriptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabaseClient
      .from("subscriptions")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", subscriptionId);

    if (error) {
      console.error("[Trial Email] Error marking reminder sent:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Trial Email] Error in markReminderSent:", error);
    return false;
  }
};

/**
 * Process trial reminders (call from cron job)
 * Sends 3-day reminder to all subscriptions that need it
 */
export const processTrialReminders = async (): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> => {
  console.log("[Trial Email] Starting trial reminder processing");

  const subscriptions = await findSubscriptionsNeedingReminder();

  if (subscriptions.length === 0) {
    console.log("[Trial Email] No subscriptions need reminders");
    return { processed: 0, sent: 0, failed: 0 };
  }

  console.log(`[Trial Email] Processing ${subscriptions.length} trial reminders`);

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const success = await sendTrialEndingReminderEmail(subscription.user_id, subscription, subscription.plan as Plan);

    if (success) {
      await markReminderSent(subscription.id);
      sent++;
    } else {
      failed++;
    }

    // Small delay between emails
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`[Trial Email] Reminder processing complete: ${sent} sent, ${failed} failed`);

  return {
    processed: subscriptions.length,
    sent,
    failed,
  };
};

export default {
  sendTrialStartedEmail,
  sendTrialEndingReminderEmail,
  sendSubscriptionActivatedEmail,
  sendPaymentFailedEmail,
  processTrialReminders,
  canSendTrialEmails,
};
