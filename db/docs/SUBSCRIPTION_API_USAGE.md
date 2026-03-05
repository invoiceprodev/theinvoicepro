# PayFast Subscription API Usage Guide

## Overview

Supports tokenization, ad hoc payments, PayFast recurring billing, and trial-period card collection.

## Subscription Flow: Trial with Auto-Conversion

```
Signup → Create R0 authorization → PayFast card tokenization
→ Webhook stores token → 14 days pass
→ Cron charges R170.00 → Subscription activated
```

## PayFastService Methods

### `createSubscription(params)`

Creates a PayFast payment URL for subscription/tokenization.

```typescript
const url = await payfastService.createSubscription({
  userId: string,
  planId: string,
  amount: number,          // 0 for trial/tokenization
  billingDate: string,     // YYYY-MM-DD
  frequency: 'monthly' | 'yearly',
  itemName: string,
  customerEmail: string,
  subscriptionId?: string,
});
```

### `chargeStoredCard(params)`

Charges a stored card using PayFast token.

```typescript
const result = await payfastService.chargeStoredCard({
  subscriptionId: string,   // must have stored token
  amount: number,           // e.g. 170.00
  itemName: string,
  itemDescription?: string,
});
// returns: { success: boolean, paymentId?: string }
```

### `cancelSubscription(subscriptionId)`

```typescript
const result = await payfastService.cancelSubscription(subscriptionId);
// returns: { success: boolean, message?: string }
```

## Common Patterns

### Trial with mandatory card

```typescript
createSubscription({ amount: 0, billingDate: trialEndDate, ... })
```

### Immediate paid subscription

```typescript
createSubscription({ amount: 170.00, billingDate: nextMonthDate, ... })
```

### Upgrade with prorated billing

```typescript
const proratedAmount = newPlan.price - (unusedDays * currentPlan.price / 30);
chargeStoredCard({ subscriptionId, amount: Math.max(0, proratedAmount), ... })
```

## Database Schema

```sql
subscriptions:
  subscription_token TEXT  -- PayFast token for recurring charges
  trial_end TIMESTAMP      -- When trial period ends
  status VARCHAR(50)       -- 'active', 'trialing', 'cancelled', 'expired'
```

## Security Best Practices

1. Never expose tokens to the client
2. Always validate webhook signatures
3. Verify payment status before granting access
4. Log all transactions for audit
5. Monitor failed payment attempts

## Related Files

- `src/services/payfast.service.ts`
- `db/docs/PAYFAST_SETUP.md`
- `db/docs/PAYFAST_WEBHOOK_SETUP.md`
- `db/docs/TRIAL_CONVERSION_SETUP.md`
