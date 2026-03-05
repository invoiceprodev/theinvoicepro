# Trial Auto-Subscription System

## Quick Reference

The trial auto-subscription system automatically converts expired trial subscriptions to paid Starter plans.

### Files

| File                                         | Purpose                                        |
| -------------------------------------------- | ---------------------------------------------- |
| `src/services/trial-conversion.service.ts`   | Core conversion business logic                 |
| `netlify/functions/trial-conversion-cron.ts` | Scheduled Netlify Function (daily at 2 AM UTC) |
| `src/utils/trial-conversion-test.ts`         | Test helper utilities                          |

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

2. **Configure Environment Variables** (Netlify):

   - `VITE_API_URL` — Supabase project URL
   - `VITE_SUPABASE_API_KEY` — Service role key (not anon key)
   - `CRON_SECRET` — Optional authorization token

3. **Enable Scheduling** in `netlify.toml`

4. **Deploy** to Netlify

### Testing

```bash
# Manual trigger
curl -X POST https://your-site.netlify.app/.netlify/functions/trial-conversion-cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Monitoring

- **Netlify Dashboard**: Functions → trial-conversion-cron → Logs
- **Database**: Query `subscription_history` for conversion records

### Related Documentation

- Full Setup Guide: `db/docs/TRIAL_CONVERSION_SETUP.md`
- Trial Card Collection: `db/docs/TRIAL_CARD_COLLECTION_SETUP.md`
- Subscription History: `db/setup/SUBSCRIPTION_HISTORY_SETUP.md`
- PayFast Integration: `db/docs/PAYFAST_SETUP.md`
