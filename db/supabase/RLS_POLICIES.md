# Row Level Security (RLS) Policies

## Overview

Row Level Security has been implemented across all database tables to ensure data isolation and proper access control. The security model follows a simple principle:

- **Regular users**: Can only access their own data (invoices, clients, subscriptions)
- **Admins**: Can access all data across all users
- **Plans**: Publicly readable by everyone, modifiable only by admins

## Helper Functions

### `is_admin()`

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `is_owner(owner_id UUID)`

```sql
CREATE OR REPLACE FUNCTION is_owner(owner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## RLS Status

| Table             | RLS Enabled | Policies |
| ----------------- | ----------- | -------- |
| profiles          | ✅          | 4        |
| plans             | ✅          | 4        |
| clients           | ✅          | 4        |
| invoices          | ✅          | 4        |
| invoice_items     | ✅          | 4        |
| subscriptions     | ✅          | 4        |
| payments          | ✅          | 5        |
| trial_conversions | ✅          | 4        |

## Table Policy Patterns

### User-owned tables (clients, invoices, subscriptions, payments)

```sql
-- SELECT
USING (user_id = auth.uid() OR is_admin())

-- INSERT
WITH CHECK (user_id = auth.uid() OR is_admin())

-- UPDATE / DELETE
USING (user_id = auth.uid() OR is_admin())
```

### Plans table (public read, admin write)

```sql
-- SELECT (public)
USING (true)

-- INSERT / UPDATE / DELETE (admin only)
USING / WITH CHECK (is_admin())
```

### invoice_items (ownership via parent invoice)

```sql
-- SELECT / INSERT / UPDATE / DELETE
USING (
  EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.user_id = auth.uid()
  ) OR is_admin()
)
```

## Security Guarantees

✅ Users cannot access other users' data  
✅ Admins have full access to all data  
✅ Plans are publicly readable  
✅ Users cannot create data owned by others  
✅ Invoice items inherit invoice ownership  
✅ All FK-joined tables use indexed policy checks

## Testing RLS

See `db/setup/RLS_TEST_GUIDE.sql` for test queries.

## Troubleshooting

**User can't see own data:** Check `user_id` on record matches `auth.uid()`  
**Admin can't access data:** Verify `profiles.role = 'admin'` for the user  
**Plans not visible on landing page:** Verify `USING (true)` SELECT policy exists on plans
