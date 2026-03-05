// Trial Period Helper Functions
// Calculate trial remaining days and status

import { Subscription } from "../types";

/**
 * Calculate days remaining in trial period
 * @param trialEndDate - ISO date string of when trial ends
 * @returns Number of days remaining (negative if expired)
 */
export function calculateTrialDaysRemaining(trialEndDate: string | undefined): number {
  if (!trialEndDate) return 0;

  const now = new Date();
  const endDate = new Date(trialEndDate);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if trial is expiring soon (within 3 days)
 * @param trialEndDate - ISO date string of when trial ends
 * @returns True if trial expires in 3 days or less
 */
export function isTrialExpiringSoon(trialEndDate: string | undefined): boolean {
  const daysRemaining = calculateTrialDaysRemaining(trialEndDate);
  return daysRemaining > 0 && daysRemaining <= 3;
}

/**
 * Check if trial has expired
 * @param trialEndDate - ISO date string of when trial ends
 * @returns True if trial end date has passed
 */
export function isTrialExpired(trialEndDate: string | undefined): boolean {
  const daysRemaining = calculateTrialDaysRemaining(trialEndDate);
  return daysRemaining < 0;
}

/**
 * Get trial status message for display
 * @param subscription - Subscription object
 * @returns Human-readable trial status message
 */
export function getTrialStatusMessage(subscription: Subscription): string {
  if (subscription.status !== "trial") {
    return "";
  }

  const daysRemaining = calculateTrialDaysRemaining(subscription.trial_end_date);

  if (daysRemaining < 0) {
    return "Trial expired";
  }

  if (daysRemaining === 0) {
    return "Trial ends today";
  }

  if (daysRemaining === 1) {
    return "Trial ends tomorrow";
  }

  if (isTrialExpiringSoon(subscription.trial_end_date)) {
    return `Trial ends in ${daysRemaining} days`;
  }

  return `${daysRemaining} days left in trial`;
}

/**
 * Calculate trial end date (14 days from start)
 * @param startDate - ISO date string or Date object
 * @returns ISO date string for trial end date
 */
export function calculateTrialEndDate(startDate: string | Date): string {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + 14);
  return endDate.toISOString();
}

/**
 * Format trial countdown for display (e.g., "5 days", "2 days")
 * @param trialEndDate - ISO date string of when trial ends
 * @returns Formatted countdown string
 */
export function formatTrialCountdown(trialEndDate: string | undefined): string {
  const daysRemaining = calculateTrialDaysRemaining(trialEndDate);

  if (daysRemaining < 0) {
    return "Expired";
  }

  if (daysRemaining === 0) {
    return "Today";
  }

  if (daysRemaining === 1) {
    return "1 day";
  }

  return `${daysRemaining} days`;
}

/**
 * Get trial progress percentage (0-100)
 * @param trialStartDate - ISO date string of when trial started
 * @param trialEndDate - ISO date string of when trial ends
 * @returns Percentage of trial period completed (0-100)
 */
export function getTrialProgress(trialStartDate: string | undefined, trialEndDate: string | undefined): number {
  if (!trialStartDate || !trialEndDate) return 0;

  const now = new Date();
  const start = new Date(trialStartDate);
  const end = new Date(trialEndDate);

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  const progress = (elapsed / totalDuration) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(progress)));
}
