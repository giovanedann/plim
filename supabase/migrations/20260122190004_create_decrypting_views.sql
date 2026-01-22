-- Migration 4: Swap original tables for decrypting views
-- Renames original tables and creates views that auto-decrypt amount_cents

-- ================================================================
-- DROP EXISTING TRIGGERS ON ORIGINAL TABLES
-- (They'll be recreated as INSTEAD OF triggers on views)
-- ================================================================
DROP TRIGGER IF EXISTS expense_updated_at ON public.expense;

-- ================================================================
-- DROP EXISTING RLS POLICIES ON ORIGINAL TABLES
-- (Views don't have RLS directly - it's enforced on base tables)
-- ================================================================
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expense;
DROP POLICY IF EXISTS "Users can create their own expenses" ON public.expense;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expense;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expense;

DROP POLICY IF EXISTS "Users can view their own salary history" ON public.salary_history;
DROP POLICY IF EXISTS "Users can create their own salary records" ON public.salary_history;
DROP POLICY IF EXISTS "Users can update their own salary records" ON public.salary_history;
DROP POLICY IF EXISTS "Users can delete their own salary records" ON public.salary_history;

-- ================================================================
-- RENAME ORIGINAL TABLES (keep for rollback)
-- ================================================================
ALTER TABLE public.expense RENAME TO expense_original;
ALTER TABLE public.salary_history RENAME TO salary_history_original;

-- ================================================================
-- CREATE EXPENSE VIEW (auto-decrypts amount_cents)
-- ================================================================
CREATE OR REPLACE VIEW public.expense AS
SELECT
  id,
  user_id,
  category_id,
  description,
  -- Decrypt and cast to INTEGER
  -- Falls back to legacy column if encrypted is NULL (shouldn't happen after backfill)
  CASE
    WHEN amount_cents_encrypted IS NOT NULL THEN
      (pgp_sym_decrypt(
        amount_cents_encrypted,
        private.get_encryption_key()
      ))::INTEGER
    ELSE
      amount_cents_legacy
  END AS amount_cents,
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

-- ================================================================
-- CREATE SALARY_HISTORY VIEW (auto-decrypts amount_cents)
-- ================================================================
CREATE OR REPLACE VIEW public.salary_history AS
SELECT
  id,
  user_id,
  CASE
    WHEN amount_cents_encrypted IS NOT NULL THEN
      (pgp_sym_decrypt(
        amount_cents_encrypted,
        private.get_encryption_key()
      ))::INTEGER
    ELSE
      amount_cents_legacy
  END AS amount_cents,
  effective_from,
  created_at
FROM private.salary_history_data;

-- ================================================================
-- GRANT ACCESS TO VIEWS
-- ================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_history TO service_role;

COMMENT ON VIEW public.expense IS 'Transparent decrypting view for expenses. Queries this like a regular table. amount_cents is automatically decrypted.';
COMMENT ON VIEW public.salary_history IS 'Transparent decrypting view for salary history. Queries this like a regular table. amount_cents is automatically decrypted.';
