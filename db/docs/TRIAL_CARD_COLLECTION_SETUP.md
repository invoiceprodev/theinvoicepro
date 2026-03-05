# Trial Card Collection Setup Guide

## Overview

Collect payment card details during trial signup with automatic subscription to the Starter plan when the trial ends.

## Database Changes

Run `db/migrations/TRIAL_TRACKING_MIGRATION.sql` to add to `subscriptions`:

- `trial_start_date` (TIMESTAMPTZ)
- `trial_end_date` (TIMESTAMPTZ) — start + 14 days
- `auto_renew` (BOOLEAN, default true)

Also run `db/migrations/TRIAL_CARD_COLLECTION_MIGRATION.sql` for `payfast_token` column.

## Trial Period Logic

- **Duration**: 14 days from signup
- **Card Collection**: Required at signup (authorization only, no charge)
- **Auto-charge**: R170.00 on day 15 if `auto_renew = true`

## Helper Functions (`src/utils/trial-helpers.ts`)

- `calculateTrialDaysRemaining(trialEndDate)` — days left
- `isTrialExpiringSoon(trialEndDate)` — true if ≤3 days remaining
- `isTrialExpired(trialEndDate)` — true if expired
- `getTrialStatusMessage(subscription)` — human-readable status
- `formatTrialCountdown(trialEndDate)` — "5 days", "Today", etc.
- `getTrialProgress(start, end)` — progress percentage (0–100)

## Integration Steps

### 1. Update Trial Plan Price

```sql
UPDATE plans SET price = 170.00, currency = 'ZAR' WHERE name = 'Trial';
```

### 2. Create Subscription with Trial Dates

```typescript
const trialStartDate = new Date().toISOString();
const trialEndDate = calculateTrialEndDate(trialStartDate);

const subscription = {
  user_id: userId,
  plan_id: trialPlanId,
  status: "trial",
  start_date: trialStartDate,
  trial_start_date: trialStartDate,
  trial_end_date: trialEndDate,
  auto_renew: true,
  payfast_token: payfastToken,
};
```

### 3. Display Trial Countdown

```typescript
import { formatTrialCountdown } from "@/utils/trial-helpers";
const countdown = formatTrialCountdown(subscription.trial_end_date);
```

## PayFast Card Authorization

```typescript
// Card authorization (no charge during trial)
{
  amount: 170.00,
  item_name: "Trial - R170.00/month",
  subscription_type: 1,
  billing_date: trialEndDate,
  cycles: 0,
  frequency: 3, // monthly
}
```

## Related Files

- Migrations: `db/migrations/TRIAL_TRACKING_MIGRATION.sql`, `db/migrations/TRIAL_CARD_COLLECTION_MIGRATION.sql`
- Helpers: `src/utils/trial-helpers.ts`
- PayFast Setup: `db/docs/PAYFAST_SETUP.md`
