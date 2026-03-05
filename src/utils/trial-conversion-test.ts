/**
 * Test Utility for Trial Conversion System
 *
 * This file provides helper functions to test the trial conversion functionality.
 * Use these in development/staging environments only.
 */

import { supabase } from "@/lib/supabase";

/**
 * Creates a test trial subscription that expires immediately
 * Useful for testing the conversion flow
 */
export async function createTestExpiredTrial(userId: string) {
  try {
    // Find Trial plan
    const { data: trialPlan } = await supabase.from("plans").select("*").eq("name", "Trial").single();

    if (!trialPlan) {
      throw new Error("Trial plan not found");
    }

    // Create expired trial subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: trialPlan.id,
        status: "trial",
        auto_renew: true,
        trial_start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        trial_end_date: new Date(Date.now() - 1000), // 1 second ago (expired)
        start_date: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Test expired trial created:", subscription);
    return subscription;
  } catch (error) {
    console.error("❌ Failed to create test trial:", error);
    throw error;
  }
}

/**
 * Manually trigger trial conversion for testing
 * This simulates what the cron job does
 */
export async function testTrialConversion() {
  try {
    console.log("🔄 Testing trial conversion...");

    // Import the service (note: this would need to be adapted for browser/server context)
    const response = await fetch("/.netlify/functions/trial-conversion-cron", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    console.log("✅ Conversion result:", result);
    return result;
  } catch (error) {
    console.error("❌ Conversion test failed:", error);
    throw error;
  }
}

/**
 * Check for expired trials in the database
 */
export async function checkExpiredTrials() {
  try {
    const { data: expiredTrials, error } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        profiles:user_id (email),
        plans:plan_id (name, price)
      `,
      )
      .eq("status", "trial")
      .eq("auto_renew", true)
      .lte("trial_end_date", new Date().toISOString());

    if (error) throw error;

    console.log(`Found ${expiredTrials?.length || 0} expired trials:`, expiredTrials);
    return expiredTrials;
  } catch (error) {
    console.error("❌ Failed to check expired trials:", error);
    throw error;
  }
}

/**
 * View recent conversion history
 */
export async function viewConversionHistory(limit = 10) {
  try {
    const { data: history, error } = await supabase
      .from("subscription_history")
      .select(
        `
        *,
        profiles:user_id (email)
      `,
      )
      .eq("action_type", "upgraded")
      .ilike("notes", "%auto-subscription%")
      .order("changed_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    console.log(`📊 Recent conversions (${history?.length || 0}):`, history);
    return history;
  } catch (error) {
    console.error("❌ Failed to fetch conversion history:", error);
    throw error;
  }
}

/**
 * Reset a test subscription back to trial for re-testing
 */
export async function resetTestSubscription(subscriptionId: string) {
  try {
    const { data: trialPlan } = await supabase.from("plans").select("*").eq("name", "Trial").single();

    if (!trialPlan) {
      throw new Error("Trial plan not found");
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "trial",
        plan_id: trialPlan.id,
        trial_end_date: new Date(Date.now() - 1000), // Expire immediately
      })
      .eq("id", subscriptionId);

    if (error) throw error;

    console.log("✅ Subscription reset to expired trial");
  } catch (error) {
    console.error("❌ Failed to reset subscription:", error);
    throw error;
  }
}

// Example usage in browser console:
// import * as TrialTest from '@/utils/trial-conversion-test';
// await TrialTest.checkExpiredTrials();
// await TrialTest.testTrialConversion();
// await TrialTest.viewConversionHistory();
