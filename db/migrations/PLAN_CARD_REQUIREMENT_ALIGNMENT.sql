BEGIN;

UPDATE plans
SET
  requires_card = false,
  updated_at = NOW()
WHERE name = 'Starter/Trial';

UPDATE plans
SET
  requires_card = true,
  updated_at = NOW()
WHERE name IN ('Pro', 'Enterprise');

COMMIT;
