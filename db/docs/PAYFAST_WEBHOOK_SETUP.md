# PayFast Webhook (ITN) Setup Guide

## Overview

The PayFast webhook handler processes Instant Transaction Notifications (ITN) to update invoice and subscription statuses automatically.

## Webhook URL

**Production:**

```
https://your-app.netlify.app/.netlify/functions/payfast-webhook
```

**Local testing (ngrok):**

```
https://xxxx-xx-xxx.ngrok.io/.netlify/functions/payfast-webhook
```

## Local Testing with ngrok

1. Start Netlify dev: `netlify dev` (port 8888)
2. Start ngrok: `ngrok http 8888`
3. Copy HTTPS URL from ngrok output
4. Set as ITN URL in PayFast Sandbox Dashboard

## Webhook Data Structure

```typescript
{
  m_payment_id: string; // Your payment ID
  pf_payment_id: string; // PayFast payment ID
  payment_status: "COMPLETE" | "FAILED" | "PENDING";
  item_name: string;
  amount_gross: string;
  custom_str1: string; // invoice_id OR subscription_id
  custom_str2: string; // user_id
  custom_int1: string; // "0" = invoice, "1" = subscription
  signature: string; // MD5 security signature
}
```

## Database Updates

**Invoice payment** (`custom_int1 = "0"`):

- Creates record in `payments` table
- Updates invoice `status` → `"paid"`

**Subscription payment** (`custom_int1 = "1"`):

- Creates record in `payments` table
- Updates subscription `status` → `"active"`
- Sets new `renewal_date` (+30 days)

## Security

- **Signature verification:** MD5(`sorted_params + passphrase`) === `received_signature`
- **IP verification (optional):** Set `VITE_PAYFAST_VERIFY_IP=true`
  - Valid IPs: `197.97.145.144`, `41.74.179.194`

## Webhook Logs

Run `db/migrations/PAYFAST_WEBHOOK_LOGS_TABLE.sql` to enable persistent webhook logging.

## Deployment

1. Set all `VITE_PAYFAST_*` env vars in Netlify Dashboard
2. Deploy site
3. Update PayFast production webhook URL

## Troubleshooting

| Issue                | Solution                                                   |
| -------------------- | ---------------------------------------------------------- |
| Signature fails      | Verify `VITE_PAYFAST_PASSPHRASE` matches PayFast dashboard |
| Invoice not updated  | Check `custom_str1` contains valid invoice ID              |
| Webhook not received | Ensure ngrok is running and URL is saved in PayFast        |

## Related Files

- `src/services/payfast-webhook.service.ts`
- `netlify/functions/payfast-webhook.ts`
- `db/migrations/PAYFAST_WEBHOOK_LOGS_TABLE.sql`
- `db/docs/PAYFAST_SETUP.md`
