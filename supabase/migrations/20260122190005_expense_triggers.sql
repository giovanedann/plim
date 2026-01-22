-- Migration 5: Create INSTEAD OF triggers for expense view
-- These triggers handle INSERT, UPDATE, DELETE operations with automatic encryption

-- ================================================================
-- INSERT TRIGGER
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
    description,
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
    NEW.description,
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

  -- Set the ID for RETURNING clause to work
  NEW.id := new_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER expense_insert
  INSTEAD OF INSERT ON public.expense
  FOR EACH ROW
  EXECUTE FUNCTION private.expense_insert_trigger();

-- ================================================================
-- UPDATE TRIGGER
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
    description = COALESCE(NEW.description, description),
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

CREATE TRIGGER expense_update
  INSTEAD OF UPDATE ON public.expense
  FOR EACH ROW
  EXECUTE FUNCTION private.expense_update_trigger();

-- ================================================================
-- DELETE TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION private.expense_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  DELETE FROM private.expense_data WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER expense_delete
  INSTEAD OF DELETE ON public.expense
  FOR EACH ROW
  EXECUTE FUNCTION private.expense_delete_trigger();

-- Grant execute on trigger functions
GRANT EXECUTE ON FUNCTION private.expense_insert_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION private.expense_update_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION private.expense_delete_trigger() TO authenticated;
