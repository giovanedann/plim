-- Migration 2: Create encrypted base tables in private schema
-- These tables store the actual data with encrypted amount_cents

-- ================================================================
-- EXPENSE BASE TABLE
-- ================================================================
CREATE TABLE private.expense_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.category(id),
  description TEXT NOT NULL,

  -- Encrypted amount storage (BYTEA for pgcrypto output)
  amount_cents_encrypted BYTEA,

  -- Legacy column for rollback safety (will be dropped in cleanup migration)
  amount_cents_legacy INTEGER,

  payment_method public.payment_method NOT NULL,
  date DATE NOT NULL,
  is_recurrent BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_day INTEGER CHECK (recurrence_day >= 1 AND recurrence_day <= 31),
  recurrence_start DATE,
  recurrence_end DATE,
  installment_current INTEGER CHECK (installment_current >= 1),
  installment_total INTEGER CHECK (installment_total >= 1),
  installment_group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Preserve existing constraints
  CONSTRAINT valid_recurrence CHECK (
    (is_recurrent = FALSE) OR
    (is_recurrent = TRUE AND recurrence_day IS NOT NULL AND recurrence_start IS NOT NULL)
  ),
  CONSTRAINT valid_installment CHECK (
    (installment_current IS NULL AND installment_total IS NULL AND installment_group_id IS NULL) OR
    (installment_current IS NOT NULL AND installment_total IS NOT NULL AND installment_group_id IS NOT NULL AND installment_current <= installment_total)
  )
);

-- Enable RLS on base table
ALTER TABLE private.expense_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (same as original table)
CREATE POLICY "Users can view their own expenses"
  ON private.expense_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
  ON private.expense_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON private.expense_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON private.expense_data FOR DELETE
  USING (auth.uid() = user_id);

-- Recreate indexes
CREATE INDEX idx_expense_data_user_date ON private.expense_data(user_id, date);
CREATE INDEX idx_expense_data_installment_group ON private.expense_data(installment_group_id)
  WHERE installment_group_id IS NOT NULL;

-- Grant access to authenticated users (needed for RLS to work)
GRANT SELECT, INSERT, UPDATE, DELETE ON private.expense_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.expense_data TO service_role;

COMMENT ON TABLE private.expense_data IS 'Encrypted base table for expenses. Access through public.expense view.';
COMMENT ON COLUMN private.expense_data.amount_cents_encrypted IS 'PGP symmetric encrypted amount in centavos';
COMMENT ON COLUMN private.expense_data.amount_cents_legacy IS 'Legacy unencrypted column for rollback safety. Will be removed in cleanup migration.';

-- ================================================================
-- SALARY_HISTORY BASE TABLE
-- ================================================================
CREATE TABLE private.salary_history_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Encrypted amount storage
  amount_cents_encrypted BYTEA,

  -- Legacy column for rollback safety
  amount_cents_legacy INTEGER,

  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Preserve unique constraint
  UNIQUE (user_id, effective_from)
);

-- Enable RLS on base table
ALTER TABLE private.salary_history_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own salary history"
  ON private.salary_history_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own salary records"
  ON private.salary_history_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salary records"
  ON private.salary_history_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salary records"
  ON private.salary_history_data FOR DELETE
  USING (auth.uid() = user_id);

-- Recreate index
CREATE INDEX idx_salary_history_data_user_effective
  ON private.salary_history_data(user_id, effective_from DESC);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON private.salary_history_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.salary_history_data TO service_role;

COMMENT ON TABLE private.salary_history_data IS 'Encrypted base table for salary history. Access through public.salary_history view.';
COMMENT ON COLUMN private.salary_history_data.amount_cents_encrypted IS 'PGP symmetric encrypted monthly salary in centavos';
COMMENT ON COLUMN private.salary_history_data.amount_cents_legacy IS 'Legacy unencrypted column for rollback safety. Will be removed in cleanup migration.';
