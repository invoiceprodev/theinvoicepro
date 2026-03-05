import { processTrialReminders, sendTrialStartedEmail } from "@/templates/trial-emails";
import type { Subscription, Plan } from "@/types";

/**
 * Trial Email Scheduler Service
 * Coordinates email sending for trial lifecycle events
 */

export interface EmailScheduleResult {
  remindersProcessed: number;
  remindersSent: number;
  remindersFailed: number;
}

/**
 * Schedule trial started email (called immediately on trial activation)
 * This should be called from the signup/trial activation flow
 */
export async function scheduleTrialStartedEmail(
  userId: string,
  subscription: Subscription,
  plan: Plan,
): Promise<boolean> {
  try {
    console.log(`[Email Scheduler] Scheduling trial started email for user ${userId}`);

    const success = await sendTrialStartedEmail(userId, subscription, plan);

    if (success) {
      console.log(`[Email Scheduler] Trial started email sent successfully`);
    } else {
      console.warn(`[Email Scheduler] Failed to send trial started email`);
    }

    return success;
  } catch (error) {
    console.error("[Email Scheduler] Error in scheduleTrialStartedEmail:", error);
    return false;
  }
}

/**
 * Process scheduled trial reminders (3-day warning)
 * This should be called daily by a cron job
 */
export async function processScheduledReminders(): Promise<EmailScheduleResult> {
  try {
    console.log("[Email Scheduler] Processing scheduled trial reminders");

    const result = await processTrialReminders();

    console.log(`[Email Scheduler] Reminder processing complete: ${result.sent} sent, ${result.failed} failed`);

    return {
      remindersProcessed: result.processed,
      remindersSent: result.sent,
      remindersFailed: result.failed,
    };
  } catch (error) {
    console.error("[Email Scheduler] Error processing scheduled reminders:", error);

    return {
      remindersProcessed: 0,
      remindersSent: 0,
      remindersFailed: 0,
    };
  }
}

/**
 * Run all scheduled email tasks
 * Call this from your daily cron job
 */
export async function runScheduledEmailTasks(): Promise<{
  reminders: EmailScheduleResult;
}> {
  console.log("[Email Scheduler] Starting scheduled email tasks");

  const startTime = Date.now();

  // Process 3-day trial reminders
  const reminders = await processScheduledReminders();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`[Email Scheduler] All scheduled email tasks complete in ${duration}s`);

  return {
    reminders,
  };
}

export default {
  scheduleTrialStartedEmail,
  processScheduledReminders,
  runScheduledEmailTasks,
};
