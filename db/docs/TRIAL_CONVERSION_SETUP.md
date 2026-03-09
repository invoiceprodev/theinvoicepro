# Trial Conversion Auto-Subscription Setup

See `db/docs/TRIAL_AUTO_SUBSCRIPTION_README.md` for the quick reference.

## Architecture

1. **API Cron/Worker Endpoint** — Scheduled execution handled by the backend deployment
2. **Subscription + email processing in the API** — Conversion logic and notifications

## Conversion Flow

1. Find subscriptions where `status='trial'`, `auto_renew=true`, `trial_end_date <= now()`
2. Create payment record (R170.00)
3. Update subscription: `status='active'`, plan → Starter, set renewal date (+30 days)
4. Log in `subscription_history`

## Environment Variables (API)

```bash
VITE_API_URL=https://your-project.supabase.co
VITE_SUPABASE_API_KEY=your-service-role-key  # NOT anon key
CRON_SECRET=your-random-secret-token
```

Schedule this endpoint from your backend platform or external cron service.

## Testing

```bash
# Manual trigger
curl -X POST https://api.theinvoicepro.co.za/trial-conversion-cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Create test expired trial:**

```sql
UPDATE subscriptions
SET trial_end_date = NOW() - INTERVAL '1 minute'
WHERE id = 'your-test-subscription-id';
```

## Troubleshooting

| Issue                | Check                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| No trials processed  | `SELECT * FROM subscriptions WHERE status='trial'`                                        |
| Payment fails        | Verify Starter plan exists: `SELECT * FROM plans WHERE name='Starter' AND is_active=true` |
| Function not running | Check Railway logs or your scheduler configuration                                         |

## Related Docs

- `db/docs/TRIAL_CARD_COLLECTION_SETUP.md`
- `db/setup/SUBSCRIPTION_HISTORY_SETUP.md`
- `db/docs/PAYFAST_SETUP.md`
