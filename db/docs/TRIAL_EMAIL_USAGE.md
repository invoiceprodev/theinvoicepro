# Trial Email Notifications Usage Guide

## Email Types

| Template ID                       | When Sent                | Purpose                 |
| --------------------------------- | ------------------------ | ----------------------- |
| `template_trial_welcome`          | On trial signup          | Welcome + trial details |
| `template_trial_reminder`         | 3 days before end        | Ending soon reminder    |
| `template_subscription_activated` | On successful conversion | Confirm subscription    |
| `template_payment_failed`         | On failed conversion     | Alert to update card    |

## Environment Variables

```env
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TRIAL_WELCOME_TEMPLATE_ID=template_trial_welcome
VITE_EMAILJS_TRIAL_REMINDER_TEMPLATE_ID=template_trial_reminder
VITE_EMAILJS_SUBSCRIPTION_ACTIVATED_TEMPLATE_ID=template_subscription_activated
VITE_EMAILJS_PAYMENT_FAILED_TEMPLATE_ID=template_payment_failed
```

## Usage

```typescript
import {
  sendTrialStartedEmail,
  sendTrialEndingReminderEmail,
  sendSubscriptionActivatedEmail,
  sendPaymentFailedEmail,
} from "@/templates/trial-emails";

// After trial created
await sendTrialStartedEmail(subscription, plan, profile);

// Cron job - 3 days before end
await sendTrialEndingReminderEmail(subscription, plan, profile);

// After successful conversion
await sendSubscriptionActivatedEmail(subscription, plan, profile);

// After failed payment
await sendPaymentFailedEmail(subscription, plan, profile);
```

## Automated Processing

The daily cron (`netlify/functions/trial-conversion-cron.ts`) handles:

1. Sending 3-day reminder emails
2. Processing trial conversions and sending result emails

## Error Handling

All email functions:

- Return `true/false` (never throw)
- Log warnings if EmailJS not configured
- Do not block the trial conversion process on failure

## Related Files

- Email service: `src/templates/trial-emails.ts`
- EmailJS setup: `EMAILJS_SETUP.md` (project root)
- Cron job: `netlify/functions/trial-conversion-cron.ts`
