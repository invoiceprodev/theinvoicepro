# Subscription History Setup

## Overview

The subscription history system automatically tracks all changes to user subscriptions including plan changes, status updates, and cancellations.

## Database Structure

### Table: `subscription_history`

Stores a complete audit trail of all subscription changes.

**Columns:**

- `id` (UUID, primary key)
- `subscription_id` (UUID, foreign key to subscriptions)
- `user_id` (UUID, foreign key to auth.users)
- `old_plan_id` (UUID, nullable, foreign key to plans)
- `new_plan_id` (UUID, nullable, foreign key to plans)
- `old_status` (TEXT, nullable)
- `new_status` (TEXT, nullable)
- `action_type` (TEXT) - Types: 'created', 'plan_changed', 'status_changed', 'cancelled', 'upgraded', 'downgraded'
- `changed_at` (TIMESTAMPTZ, default now())
- `notes` (TEXT, nullable)

## Automatic Tracking

A PostgreSQL trigger (`log_subscription_changes`) automatically creates history records whenever:

- A new subscription is created
- A subscription's plan is changed
- A subscription's status is updated

**Trigger Logic:**

- On INSERT: Records subscription creation
- On UPDATE:
  - Detects plan changes and logs as 'plan_changed', 'upgraded', or 'downgraded'
  - Detects status changes and logs as 'status_changed'

## Usage in UI

### Manage Subscription Modal

The subscription history is displayed in the "History" tab of the manage subscription modal:

**Features:**

- Timeline view showing last 10 changes
- Visual indicators for different action types
- Plan name display with pricing changes
- Timestamps in local timezone
- Color-coded badges for different actions

**Access:**

1. Open subscription list at `/admin/subscriptions`
2. Click "Manage" on any subscription
3. Switch to "History" tab

## Query Examples

### View all history for a subscription

```sql
SELECT
  sh.*,
  old_plan.name as old_plan_name,
  new_plan.name as new_plan_name
FROM subscription_history sh
LEFT JOIN plans old_plan ON sh.old_plan_id = old_plan.id
LEFT JOIN plans new_plan ON sh.new_plan_id = new_plan.id
WHERE sh.subscription_id = 'YOUR_SUBSCRIPTION_ID'
ORDER BY sh.changed_at DESC;
```

### View user's complete subscription history

```sql
SELECT
  sh.*,
  s.status as current_status,
  p.name as current_plan_name
FROM subscription_history sh
JOIN subscriptions s ON sh.subscription_id = s.id
JOIN plans p ON s.plan_id = p.id
WHERE sh.user_id = 'YOUR_USER_ID'
ORDER BY sh.changed_at DESC;
```

## Action Types

| Action Type      | Description                              | Badge Color       |
| ---------------- | ---------------------------------------- | ----------------- |
| `created`        | Initial subscription creation            | Default (blue)    |
| `plan_changed`   | Generic plan change                      | Secondary (gray)  |
| `upgraded`       | Changed to higher-tier plan              | Secondary (gray)  |
| `downgraded`     | Changed to lower-tier plan               | Secondary (gray)  |
| `status_changed` | Status update (active/cancelled/expired) | Outline           |
| `cancelled`      | Subscription cancelled                   | Destructive (red) |

## Row Level Security (RLS)

RLS policies ensure users can only see their own subscription history:

**Policies:**

- `Users can view own subscription history` - SELECT for own records
- `Admins can view all subscription history` - SELECT for admin role

**Admin Access:**
Admins can view all subscription history across all users through the admin dashboard.

## TypeScript Types

```typescript
export interface SubscriptionHistory {
  id: string;
  subscription_id: string;
  user_id: string;
  old_plan_id: string | null;
  new_plan_id: string | null;
  old_status: string | null;
  new_status: string | null;
  action_type: string;
  changed_at: string;
  notes: string | null;
  old_plan?: Plan;
  new_plan?: Plan;
}
```

## Future Enhancements

Potential improvements:

- Export history to CSV/PDF
- Email notifications on subscription changes
- Analytics dashboard showing subscription trends
- Automatic refund tracking
- Payment history integration
