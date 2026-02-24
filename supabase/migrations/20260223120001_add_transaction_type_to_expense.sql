-- Add transaction type column to distinguish expenses from incomes.
-- Incomes are simpler: no category, no installments, no recurrence.

-- ================================================================
-- STEP 1: Add type column to the underlying base table
-- ================================================================
ALTER TABLE private.expense_data
  ADD COLUMN type TEXT NOT NULL DEFAULT 'expense';

-- Constrain allowed values
ALTER TABLE private.expense_data
  ADD CONSTRAINT expense_type_check CHECK (type IN ('expense', 'income'));

-- ================================================================
-- STEP 2: Make category_id nullable (incomes don't have categories)
-- ================================================================
ALTER TABLE private.expense_data
  ALTER COLUMN category_id DROP NOT NULL;

-- ================================================================
-- STEP 3: Add check constraint for type/category consistency
-- Expenses must have a category_id; incomes must not.
-- ================================================================
ALTER TABLE private.expense_data
  ADD CONSTRAINT expense_category_check CHECK (
    (type = 'expense' AND category_id IS NOT NULL) OR
    (type = 'income')
  );

-- ================================================================
-- STEP 4: Add index for type filtering
-- ================================================================
CREATE INDEX idx_expense_type ON private.expense_data(type);

COMMENT ON COLUMN private.expense_data.type IS 'Transaction type: expense or income';

-- ================================================================
-- STEP 5: Recreate the expense view to include type column
-- ================================================================
DROP VIEW IF EXISTS public.expense;

CREATE VIEW public.expense WITH (security_invoker = true) AS
SELECT
    id,
    user_id,
    type,
    category_id,
    CASE
        WHEN description_encrypted IS NOT NULL THEN pgp_sym_decrypt(description_encrypted, private.get_encryption_key())
        ELSE NULL::text
    END AS description,
    CASE
        WHEN amount_cents_encrypted IS NOT NULL THEN pgp_sym_decrypt(amount_cents_encrypted, private.get_encryption_key())::integer
        ELSE NULL::integer
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
    credit_card_id,
    recurrent_group_id,
    created_at,
    updated_at
FROM private.expense_data;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO service_role;

COMMENT ON VIEW public.expense IS 'Transparent decrypting view for expenses and incomes. type column distinguishes between them.';

-- ================================================================
-- STEP 6: Recreate INSERT trigger to handle type column
-- ================================================================
CREATE OR REPLACE FUNCTION private.expense_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF NEW.amount_cents IS NULL OR NEW.amount_cents <= 0 THEN
    RAISE EXCEPTION 'amount_cents must be greater than 0';
  END IF;

  INSERT INTO private.expense_data (
    id,
    user_id,
    type,
    category_id,
    description_encrypted,
    amount_cents_encrypted,
    payment_method,
    date,
    is_recurrent,
    recurrence_day,
    recurrence_start,
    recurrence_end,
    installment_current,
    installment_total,
    installment_group_id,
    credit_card_id,
    recurrent_group_id,
    created_at,
    updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    COALESCE(NEW.type, 'expense'),
    NEW.category_id,
    CASE
      WHEN NEW.description IS NOT NULL THEN
        pgp_sym_encrypt(
          NEW.description,
          private.get_encryption_key(),
          'compress-algo=1, cipher-algo=aes256'
        )
      ELSE NULL
    END,
    pgp_sym_encrypt(
      NEW.amount_cents::TEXT,
      private.get_encryption_key(),
      'compress-algo=1, cipher-algo=aes256'
    ),
    NEW.payment_method,
    NEW.date,
    COALESCE(NEW.is_recurrent, FALSE),
    NEW.recurrence_day,
    NEW.recurrence_start,
    NEW.recurrence_end,
    NEW.installment_current,
    NEW.installment_total,
    NEW.installment_group_id,
    NEW.credit_card_id,
    NEW.recurrent_group_id,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  RETURNING id INTO new_id;

  NEW.id := new_id;
  RETURN NEW;
END;
$$;

-- ================================================================
-- STEP 7: Recreate UPDATE trigger to handle type column
-- ================================================================
CREATE OR REPLACE FUNCTION private.expense_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
BEGIN
  IF NEW.amount_cents IS NOT NULL AND NEW.amount_cents <= 0 THEN
    RAISE EXCEPTION 'amount_cents must be greater than 0';
  END IF;

  UPDATE private.expense_data
  SET
    type = COALESCE(NEW.type, type),
    category_id = NEW.category_id,
    description_encrypted = CASE
      WHEN NEW.description IS DISTINCT FROM OLD.description THEN
        CASE
          WHEN NEW.description IS NOT NULL THEN
            pgp_sym_encrypt(
              NEW.description,
              private.get_encryption_key(),
              'compress-algo=1, cipher-algo=aes256'
            )
          ELSE NULL
        END
      ELSE description_encrypted
    END,
    amount_cents_encrypted = CASE
      WHEN NEW.amount_cents IS NOT NULL AND NEW.amount_cents != OLD.amount_cents THEN
        pgp_sym_encrypt(
          NEW.amount_cents::TEXT,
          private.get_encryption_key(),
          'compress-algo=1, cipher-algo=aes256'
        )
      ELSE amount_cents_encrypted
    END,
    payment_method = COALESCE(NEW.payment_method, payment_method),
    date = COALESCE(NEW.date, date),
    is_recurrent = COALESCE(NEW.is_recurrent, is_recurrent),
    recurrence_day = NEW.recurrence_day,
    recurrence_start = NEW.recurrence_start,
    recurrence_end = NEW.recurrence_end,
    installment_current = NEW.installment_current,
    installment_total = NEW.installment_total,
    installment_group_id = NEW.installment_group_id,
    credit_card_id = NEW.credit_card_id,
    recurrent_group_id = NEW.recurrent_group_id,
    updated_at = NOW()
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

-- ================================================================
-- STEP 8: Recreate INSTEAD OF triggers on the view
-- (Dropping the view also drops all attached triggers)
-- ================================================================
DROP TRIGGER IF EXISTS expense_insert ON public.expense;
DROP TRIGGER IF EXISTS expense_update ON public.expense;
DROP TRIGGER IF EXISTS expense_delete ON public.expense;

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
