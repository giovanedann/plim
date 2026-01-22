-- Migration 3: Backfill existing data to encrypted tables
-- Copies all data from original tables and encrypts amount_cents

-- ================================================================
-- BACKFILL EXPENSE DATA
-- ================================================================
INSERT INTO private.expense_data (
  id,
  user_id,
  category_id,
  description,
  amount_cents_encrypted,
  amount_cents_legacy,
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
)
SELECT
  id,
  user_id,
  category_id,
  description,
  pgp_sym_encrypt(
    amount_cents::TEXT,
    private.get_encryption_key(),
    'compress-algo=1, cipher-algo=aes256'
  ),
  amount_cents,  -- Keep legacy for rollback safety
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
FROM public.expense;

-- ================================================================
-- BACKFILL SALARY_HISTORY DATA
-- ================================================================
INSERT INTO private.salary_history_data (
  id,
  user_id,
  amount_cents_encrypted,
  amount_cents_legacy,
  effective_from,
  created_at
)
SELECT
  id,
  user_id,
  pgp_sym_encrypt(
    amount_cents::TEXT,
    private.get_encryption_key(),
    'compress-algo=1, cipher-algo=aes256'
  ),
  amount_cents,  -- Keep legacy for rollback safety
  effective_from,
  created_at
FROM public.salary_history;

-- ================================================================
-- VERIFY BACKFILL
-- ================================================================
DO $$
DECLARE
  expense_orig_count INTEGER;
  expense_new_count INTEGER;
  salary_orig_count INTEGER;
  salary_new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO expense_orig_count FROM public.expense;
  SELECT COUNT(*) INTO expense_new_count FROM private.expense_data;
  SELECT COUNT(*) INTO salary_orig_count FROM public.salary_history;
  SELECT COUNT(*) INTO salary_new_count FROM private.salary_history_data;

  IF expense_orig_count != expense_new_count THEN
    RAISE EXCEPTION 'Expense backfill mismatch: original=%, new=%',
      expense_orig_count, expense_new_count;
  END IF;

  IF salary_orig_count != salary_new_count THEN
    RAISE EXCEPTION 'Salary history backfill mismatch: original=%, new=%',
      salary_orig_count, salary_new_count;
  END IF;

  RAISE NOTICE 'Backfill complete: % expenses, % salary records',
    expense_new_count, salary_new_count;
END $$;
