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
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@theinvoicepro.co.za
VITE_API_URL=http://127.0.0.1:3000
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

The daily cron / backend scheduler handles:

1. Sending 3-day reminder emails
2. Processing trial conversions and sending result emails

## Error Handling

All email functions:

- Return `true/false` (never throw)
- Log warnings if the API email service is not configured
- Do not block the trial conversion process on failure

## Related Files

- Email service: `src/templates/trial-emails.ts`
- Email delivery: `api/src/resend.ts`
- Cron endpoint: `api/src/server.ts`
