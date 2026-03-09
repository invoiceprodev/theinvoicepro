# Trial Auto-Subscription System

## Quick Reference

The trial auto-subscription system automatically converts expired trial subscriptions to paid Starter plans.

### Files

| File                                         | Purpose                                        |
| -------------------------------------------- | ---------------------------------------------- |
| Backend scheduler / cron endpoint            | Scheduled execution for daily trial conversion |
| `api/src/server.ts`                          | Subscription conversion and notification entry points |

### How It Works

1. **Daily Execution**: Cron job runs at 2 AM UTC
2. **Find Expired Trials**: Queries subscriptions where `status='trial'` and `trial_end_date <= now()`
3. **Create Payments**: Generates R170.00 payment records for Starter plan
4. **Update Status**: Changes subscription from `'trial'` to `'active'`
5. **Log History**: Records conversion in `subscription_history` table

### Setup Steps

1. **Run database migrations:**

   - `db/migrations/TRIAL_TRACKING_MIGRATION.sql`
   - `db/migrations/TRIAL_CARD_COLLECTION_MIGRATION.sql`

2. **Configure Environment Variables** (API):

   - `VITE_API_URL` — Supabase project URL
   - `VITE_SUPABASE_API_KEY` — Service role key (not anon key)
   - `CRON_SECRET` — Optional authorization token

3. **Enable Scheduling** in Railway or your external scheduler

4. **Deploy** the API

### Testing

```bash
# Manual trigger
curl -X POST https://api.theinvoicepro.co.za/trial-conversion-cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Monitoring

- **Railway / API logs**: Inspect the scheduler target and backend logs
- **Database**: Query `subscription_history` for conversion records

### Related Documentation

- Full Setup Guide: `db/docs/TRIAL_CONVERSION_SETUP.md`
- Trial Card Collection: `db/docs/TRIAL_CARD_COLLECTION_SETUP.md`
- Subscription History: `db/setup/SUBSCRIPTION_HISTORY_SETUP.md`
- PayFast Integration: `db/docs/PAYFAST_SETUP.md`
