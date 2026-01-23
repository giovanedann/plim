-- Migration: Remove plain-text description column from expense_data
-- Now that descriptions are encrypted, the legacy plain-text column can be removed

-- ================================================================
-- STEP 1: Drop the view first (it depends on the column)
-- ================================================================
DROP VIEW IF EXISTS public.expense CASCADE;

-- ================================================================
-- STEP 2: Drop the plain-text description column
-- ================================================================
ALTER TABLE private.expense_data
  DROP COLUMN description;

-- ================================================================
-- STEP 3: Create view with only encrypted description
-- ================================================================
CREATE OR REPLACE VIEW public.expense AS
SELECT
  id,
  user_id,
  category_id,
  -- Decrypt description
  pgp_sym_decrypt(
    description_encrypted,
    private.get_encryption_key()
  ) AS description,
  -- Decrypt amount_cents
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

-- ================================================================
-- STEP 4: Update INSERT trigger (no longer stores plain-text)
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
  -- Enforce CHECK constraint: amount_cents > 0
  IF NEW.amount_cents IS NULL OR NEW.amount_cents <= 0 THEN
    RAISE EXCEPTION 'amount_cents must be greater than 0';
  END IF;

  INSERT INTO private.expense_data (
    id,
    user_id,
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
    created_at,
    updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.category_id,
    pgp_sym_encrypt(
      NEW.description,
      private.get_encryption_key(),
      'compress-algo=1, cipher-algo=aes256'
    ),
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
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  RETURNING id INTO new_id;

  NEW.id := new_id;
  RETURN NEW;
END;
$$;

-- ================================================================
-- STEP 5: Update UPDATE trigger (no longer stores plain-text)
-- ================================================================
CREATE OR REPLACE FUNCTION private.expense_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
BEGIN
  -- Enforce CHECK constraint if amount_cents is being updated
  IF NEW.amount_cents IS NOT NULL AND NEW.amount_cents <= 0 THEN
    RAISE EXCEPTION 'amount_cents must be greater than 0';
  END IF;

  UPDATE private.expense_data
  SET
    category_id = COALESCE(NEW.category_id, category_id),
    description_encrypted = CASE
      WHEN NEW.description IS NOT NULL AND NEW.description != OLD.description THEN
        pgp_sym_encrypt(
          NEW.description,
          private.get_encryption_key(),
          'compress-algo=1, cipher-algo=aes256'
        )
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
    updated_at = NOW()
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

-- ================================================================
-- STEP 6: Recreate triggers
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

-- ================================================================
-- STEP 7: Grant permissions on view
-- ================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO service_role;

COMMENT ON VIEW public.expense IS 'Transparent decrypting view for expenses. Both amount_cents and description are encrypted at rest.';
