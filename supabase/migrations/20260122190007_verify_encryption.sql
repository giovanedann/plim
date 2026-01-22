-- Migration 7: Verify encryption migration
-- This migration runs verification checks and creates a monitoring view

-- ================================================================
-- VERIFICATION CHECKS
-- ================================================================
DO $$
DECLARE
  expense_count INTEGER;
  expense_encrypted_count INTEGER;
  salary_count INTEGER;
  salary_encrypted_count INTEGER;
  sample_expense_id UUID;
  sample_expense_amount INTEGER;
  decrypted_amount INTEGER;
  sample_salary_id UUID;
  sample_salary_amount INTEGER;
BEGIN
  -- Count verification
  SELECT COUNT(*) INTO expense_count FROM public.expense;
  SELECT COUNT(*) INTO expense_encrypted_count
  FROM private.expense_data WHERE amount_cents_encrypted IS NOT NULL;

  SELECT COUNT(*) INTO salary_count FROM public.salary_history;
  SELECT COUNT(*) INTO salary_encrypted_count
  FROM private.salary_history_data WHERE amount_cents_encrypted IS NOT NULL;

  RAISE NOTICE '=== ENCRYPTION MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Expense records: total=%, encrypted=%', expense_count, expense_encrypted_count;
  RAISE NOTICE 'Salary records: total=%, encrypted=%', salary_count, salary_encrypted_count;

  -- Verify all records are encrypted
  IF expense_count != expense_encrypted_count THEN
    RAISE WARNING 'Not all expense records are encrypted!';
  END IF;

  IF salary_count != salary_encrypted_count THEN
    RAISE WARNING 'Not all salary records are encrypted!';
  END IF;

  -- Sample decryption verification for expense
  SELECT id, amount_cents INTO sample_expense_id, sample_expense_amount
  FROM public.expense LIMIT 1;

  IF sample_expense_id IS NOT NULL THEN
    -- Verify the decrypted value from view matches direct decryption
    SELECT (pgp_sym_decrypt(amount_cents_encrypted, private.get_encryption_key()))::INTEGER
    INTO decrypted_amount
    FROM private.expense_data WHERE id = sample_expense_id;

    IF sample_expense_amount != decrypted_amount THEN
      RAISE EXCEPTION 'Decryption verification failed for expense %', sample_expense_id;
    END IF;

    RAISE NOTICE 'Sample expense decryption verified: id=%, amount=%',
      sample_expense_id, sample_expense_amount;
  END IF;

  -- Sample decryption verification for salary
  SELECT id, amount_cents INTO sample_salary_id, sample_salary_amount
  FROM public.salary_history LIMIT 1;

  IF sample_salary_id IS NOT NULL THEN
    SELECT (pgp_sym_decrypt(amount_cents_encrypted, private.get_encryption_key()))::INTEGER
    INTO decrypted_amount
    FROM private.salary_history_data WHERE id = sample_salary_id;

    IF sample_salary_amount != decrypted_amount THEN
      RAISE EXCEPTION 'Decryption verification failed for salary %', sample_salary_id;
    END IF;

    RAISE NOTICE 'Sample salary decryption verified: id=%, amount=%',
      sample_salary_id, sample_salary_amount;
  END IF;

  RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;

-- ================================================================
-- CREATE MONITORING VIEW (for admin use)
-- ================================================================
CREATE OR REPLACE VIEW private.encryption_status AS
SELECT
  'expense' AS table_name,
  COUNT(*) AS total_records,
  COUNT(*) FILTER (WHERE amount_cents_encrypted IS NOT NULL) AS encrypted_records,
  COUNT(*) FILTER (WHERE amount_cents_legacy IS NOT NULL) AS legacy_records
FROM private.expense_data
UNION ALL
SELECT
  'salary_history',
  COUNT(*),
  COUNT(*) FILTER (WHERE amount_cents_encrypted IS NOT NULL),
  COUNT(*) FILTER (WHERE amount_cents_legacy IS NOT NULL)
FROM private.salary_history_data;

COMMENT ON VIEW private.encryption_status IS 'Monitor encryption migration status. Use to verify all records are encrypted before running cleanup migration.';

-- Grant access to monitoring view for admin
GRANT SELECT ON private.encryption_status TO postgres;
GRANT SELECT ON private.encryption_status TO service_role;
