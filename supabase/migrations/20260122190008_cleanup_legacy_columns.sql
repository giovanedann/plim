-- Migration 8: Cleanup - Remove legacy unencrypted columns
-- Run after verifying encryption works correctly

-- Step 1: Drop and recreate monitoring view without legacy reference
DROP VIEW IF EXISTS private.encryption_status;
CREATE VIEW private.encryption_status AS
SELECT
  'expense' AS table_name,
  COUNT(*) AS total_records,
  COUNT(*) FILTER (WHERE amount_cents_encrypted IS NOT NULL) AS encrypted_records
FROM private.expense_data
UNION ALL
SELECT
  'salary_history',
  COUNT(*),
  COUNT(*) FILTER (WHERE amount_cents_encrypted IS NOT NULL)
FROM private.salary_history_data;

GRANT SELECT ON private.encryption_status TO postgres;
GRANT SELECT ON private.encryption_status TO service_role;

-- Step 2: Drop and recreate expense view without legacy fallback
DROP VIEW IF EXISTS public.expense CASCADE;
CREATE VIEW public.expense AS
SELECT
  id,
  user_id,
  category_id,
  description,
  (pgp_sym_decrypt(
    amount_cents_encrypted,
    private.get_encryption_key()
  ))::INTEGER AS amount_cents,
  payment_method,
  date,
  is_recurrent,
  recurrence_day,
  recurrence_start,
  recurrence_end,
  installment_current,
  installment_total,
  installment_group_id,
  created_at,
  updated_at
FROM private.expense_data;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO service_role;

-- Recreate expense triggers
CREATE TRIGGER expense_insert
  INSTEAD OF INSERT ON public.expense
  FOR EACH ROW
  EXECUTE FUNCTION private.expense_insert_trigger();

CREATE TRIGGER expense_update
  INSTEAD OF UPDATE ON public.expense
  FOR EACH ROW
  EXECUTE FUNCTION private.expense_update_trigger();

CREATE TRIGGER expense_delete
  INSTEAD OF DELETE ON public.expense
  FOR EACH ROW
  EXECUTE FUNCTION private.expense_delete_trigger();

-- Step 3: Drop and recreate salary_history view
DROP VIEW IF EXISTS public.salary_history CASCADE;
CREATE VIEW public.salary_history AS
SELECT
  id,
  user_id,
  (pgp_sym_decrypt(
    amount_cents_encrypted,
    private.get_encryption_key()
  ))::INTEGER AS amount_cents,
  effective_from,
  created_at
FROM private.salary_history_data;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_history TO service_role;

-- Recreate salary triggers
CREATE TRIGGER salary_history_insert
  INSTEAD OF INSERT ON public.salary_history
  FOR EACH ROW
  EXECUTE FUNCTION private.salary_history_insert_trigger();

CREATE TRIGGER salary_history_update
  INSTEAD OF UPDATE ON public.salary_history
  FOR EACH ROW
  EXECUTE FUNCTION private.salary_history_update_trigger();

CREATE TRIGGER salary_history_delete
  INSTEAD OF DELETE ON public.salary_history
  FOR EACH ROW
  EXECUTE FUNCTION private.salary_history_delete_trigger();

-- Recreate upsert_salary function (dropped by CASCADE)
CREATE OR REPLACE FUNCTION public.upsert_salary(
  p_user_id UUID,
  p_amount_cents INTEGER,
  p_effective_from DATE
)
RETURNS public.salary_history
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  result_record public.salary_history;
  existing_id UUID;
BEGIN
  IF p_amount_cents < 0 THEN
    RAISE EXCEPTION 'amount_cents must be greater than or equal to 0';
  END IF;

  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify salary for another user';
  END IF;

  SELECT id INTO existing_id
  FROM private.salary_history_data
  WHERE user_id = p_user_id AND effective_from = p_effective_from;

  IF existing_id IS NOT NULL THEN
    UPDATE private.salary_history_data
    SET amount_cents_encrypted = pgp_sym_encrypt(
      p_amount_cents::TEXT,
      private.get_encryption_key(),
      'compress-algo=1, cipher-algo=aes256'
    )
    WHERE id = existing_id;
  ELSE
    INSERT INTO private.salary_history_data (
      user_id,
      amount_cents_encrypted,
      effective_from
    ) VALUES (
      p_user_id,
      pgp_sym_encrypt(
        p_amount_cents::TEXT,
        private.get_encryption_key(),
        'compress-algo=1, cipher-algo=aes256'
      ),
      p_effective_from
    )
    RETURNING id INTO existing_id;
  END IF;

  SELECT * INTO result_record
  FROM public.salary_history
  WHERE id = existing_id;

  RETURN result_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_salary(UUID, INTEGER, DATE) TO authenticated;

-- Step 4: Now drop the legacy columns
ALTER TABLE private.expense_data DROP COLUMN amount_cents_legacy;
ALTER TABLE private.salary_history_data DROP COLUMN amount_cents_legacy;

-- Step 5: Drop the original tables
DROP TABLE IF EXISTS public.expense_original CASCADE;
DROP TABLE IF EXISTS public.salary_history_original CASCADE;
