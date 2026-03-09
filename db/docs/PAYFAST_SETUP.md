# PayFast Payment Integration Setup

## Overview

PayFast is the primary payment gateway for TheInvoicePro — handling invoice payments and subscription billing in ZAR.

## Environment Variables

Add to your `.env` and backend environment settings:

```env
VITE_PAYFAST_MERCHANT_ID=your_merchant_id
VITE_PAYFAST_MERCHANT_KEY=your_merchant_key
VITE_PAYFAST_PASSPHRASE=your_passphrase_here
VITE_PAYFAST_MODE=sandbox
PAYFAST_NOTIFY_URL=https://api.theinvoicepro.co.za/payfast/webhook
```

## Getting PayFast Credentials

1. Sign up at https://www.payfast.co.za
2. Go to Settings → Integration
3. Copy Merchant ID and Merchant Key
4. Set a secure Passphrase and save it in your `.env`

## Sandbox Testing

- Sandbox URL: https://sandbox.payfast.co.za
- Use sandbox credentials (separate from production)
- Test card details available in PayFast sandbox docs

## Payment Flows

### Invoice Payment

```
User clicks "Pay Now" → Redirect to PayFast → Payment complete
→ Webhook fires → Invoice status updated to "paid"
```

### Subscription / Trial Card Collection

```
User signs up → PayFast card authorization (R0) → Token stored
→ 14 days later → Auto-charge R170.00 → Subscription activated
```

## Key Files

| File                                           | Purpose                     |
| ---------------------------------------------- | --------------------------- |
| `src/services/payfast.service.ts`              | Legacy client helper methods |
| `api/src/payfast.ts`                           | Server-side checkout signing |
| `api/src/server.ts`                            | PayFast webhook + checkout endpoints |
| `db/setup/PAYMENTS_TABLE_SETUP.sql`            | Payments table SQL |
| `db/migrations/PAYFAST_WEBHOOK_LOGS_TABLE.sql` | Webhook logs table SQL |

## Webhook Setup

See `db/docs/PAYFAST_WEBHOOK_SETUP.md` for full webhook configuration.

**Production webhook URL:**

```
https://api.theinvoicepro.co.za/payfast/webhook
```

## Subscription API

For recurring billing and trial card tokenization, see `db/docs/SUBSCRIPTION_API_USAGE.md`.

## Resources

- PayFast Docs: https://developers.payfast.co.za
- PayFast ITN Guide: https://developers.payfast.co.za/docs#instant_transaction_notification
- PayFast Support: support@payfast.co.za
