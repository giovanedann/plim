-- Migration 9: Fix Security and Performance Advisor Warnings
-- Fixes:
-- - Security definer views (use security_invoker instead)
-- - RLS policies using auth.uid() instead of (select auth.uid())
-- - Missing index on expense_data.category_id

-- ================================================================
-- 1. FIX SECURITY DEFINER VIEWS
-- Recreate views with security_invoker = true (PostgreSQL 15+)
-- This makes the view use the permissions of the querying user
-- ================================================================

DROP VIEW IF EXISTS public.expense CASCADE;
CREATE VIEW public.expense
WITH (security_invoker = true)
AS
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

DROP VIEW IF EXISTS public.salary_history CASCADE;
CREATE VIEW public.salary_history
WITH (security_invoker = true)
AS
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

-- ================================================================
-- 2. ADD MISSING INDEX
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_expense_data_category_id ON private.expense_data(category_id);

-- ================================================================
-- 3. FIX RLS POLICIES - wrap auth.uid() in (select auth.uid())
-- This prevents re-evaluation of auth.uid() for each row
-- ================================================================

-- Profile table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profile;
CREATE POLICY "Users can view their own profile" ON public.profile
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profile;
CREATE POLICY "Users can update their own profile" ON public.profile
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Category table
DROP POLICY IF EXISTS "Users can view system defaults and their own categories" ON public.category;
CREATE POLICY "Users can view system defaults and their own categories" ON public.category
  FOR SELECT USING (user_id IS NULL OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own categories" ON public.category;
CREATE POLICY "Users can create their own categories" ON public.category
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own categories" ON public.category;
CREATE POLICY "Users can update their own categories" ON public.category
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.category;
CREATE POLICY "Users can delete their own categories" ON public.category
  FOR DELETE USING (user_id = (select auth.uid()));

-- private.expense_data table
DROP POLICY IF EXISTS "Users can view their own expenses" ON private.expense_data;
CREATE POLICY "Users can view their own expenses" ON private.expense_data
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own expenses" ON private.expense_data;
CREATE POLICY "Users can create their own expenses" ON private.expense_data
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own expenses" ON private.expense_data;
CREATE POLICY "Users can update their own expenses" ON private.expense_data
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own expenses" ON private.expense_data;
CREATE POLICY "Users can delete their own expenses" ON private.expense_data
  FOR DELETE USING (user_id = (select auth.uid()));

-- private.salary_history_data table
DROP POLICY IF EXISTS "Users can view their own salary history" ON private.salary_history_data;
CREATE POLICY "Users can view their own salary history" ON private.salary_history_data
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own salary records" ON private.salary_history_data;
CREATE POLICY "Users can create their own salary records" ON private.salary_history_data
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own salary records" ON private.salary_history_data;
CREATE POLICY "Users can update their own salary records" ON private.salary_history_data
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own salary records" ON private.salary_history_data;
CREATE POLICY "Users can delete their own salary records" ON private.salary_history_data
  FOR DELETE USING (user_id = (select auth.uid()));
