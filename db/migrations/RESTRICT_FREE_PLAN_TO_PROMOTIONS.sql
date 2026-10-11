BEGIN;

UPDATE public.plans
SET is_active = false,
    updated_at = NOW()
WHERE lower(btrim(name)) = 'free'
  AND price = 0;

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT name, price, is_active
FROM public.plans
WHERE lower(btrim(name)) = 'free';