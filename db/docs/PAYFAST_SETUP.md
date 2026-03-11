# PayFast Payment Integration Setup

## Overview

PayFast is the primary payment gateway for TheInvoicePro — handling invoice payments and subscription billing in ZAR.

## Current Status

- App-side PayFast checkout and webhook code is in place
- Current blocker is the PayFast merchant account itself
- Latest live error: `Merchant unable to receive payments due to invalid account details provided.`
- Resume here next time:
  - verify PayFast account activation/FICA status
  - verify banking/account details in PayFast
  - confirm live payments and recurring billing are enabled
  - then re-test checkout against `https://api.theinvoicepro.co.za/payfast/webhook`

## Environment Variables

Add these to your API `.env` and Railway environment settings:

```env
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase_here
PAYFAST_MODE=sandbox
PAYFAST_NOTIFY_URL=https://api.theinvoicepro.co.za/payfast/webhook
```

Do not expose PayFast merchant credentials in frontend `VITE_*` variables.

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
User selects a card-required plan → PayFast card authorization
→ Token stored on the subscription → Recurring billing starts on renewal
```

## Key Files

| File                                           | Purpose                     |
| ---------------------------------------------- | --------------------------- |
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
