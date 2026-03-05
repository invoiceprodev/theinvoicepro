# Trial Analytics & Conversion Tracking Setup

## Overview

Tracks trial-to-paid conversion status: active trials, successful conversions, failures, and cancellations.

## Setup

### 1. Run the Migration

Execute `db/migrations/TRIAL_ANALYTICS_MIGRATION.sql` in Supabase SQL Editor.

This creates:

- `trial_conversions` table with indexes and RLS policies
- Sample data for testing (remove before production)

### 2. Remove Sample Data (Production)

```sql
DELETE FROM trial_conversions WHERE notes LIKE 'Sample%';
```

## Table Schema

| Column             | Type        | Description                                        |
| ------------------ | ----------- | -------------------------------------------------- |
| `id`               | UUID        | Primary key                                        |
| `user_id`          | UUID        | Reference to profiles                              |
| `trial_start_date` | TIMESTAMPTZ | When trial started                                 |
| `trial_end_date`   | TIMESTAMPTZ | When trial ends/ended                              |
| `conversion_date`  | TIMESTAMPTZ | Date successfully converted (null if not)          |
| `status`           | TEXT        | `active_trial`, `converted`, `cancelled`, `failed` |
| `payment_id`       | UUID        | Reference to payments                              |
| `subscription_id`  | UUID        | Reference to subscriptions                         |
| `failure_reason`   | TEXT        | Reason for failed conversion                       |

## Example Queries

```sql
-- Active trials expiring today
SELECT tc.*, p.full_name, p.email
FROM trial_conversions tc
JOIN profiles p ON tc.user_id = p.id
WHERE tc.status = 'active_trial' AND DATE(tc.trial_end_date) = CURRENT_DATE;

-- Overall conversion rate
SELECT
  COUNT(*) FILTER (WHERE status = 'converted') AS converted,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'converted')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('converted','cancelled','failed')), 0) * 100, 2
  ) AS conversion_rate_percent
FROM trial_conversions;
```

## Related Files

- Migration: `db/migrations/TRIAL_ANALYTICS_MIGRATION.sql`
- Conversion Service: `src/services/trial-conversion.service.ts`
- RLS Policies: `db/supabase/RLS_POLICIES.md`
