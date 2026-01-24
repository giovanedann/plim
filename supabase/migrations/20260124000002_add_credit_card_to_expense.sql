-- Migration: Add credit_card_id to expenses
-- Allows linking expenses to credit cards for organization

-- Add column to the base encrypted table
ALTER TABLE private.expense_data
ADD COLUMN credit_card_id UUID REFERENCES private.credit_card_data(id) ON DELETE SET NULL;

CREATE INDEX idx_expense_data_credit_card ON private.expense_data(credit_card_id);

-- Recreate the expense view to include credit_card_id
DROP VIEW IF EXISTS public.expense CASCADE;

CREATE VIEW public.expense AS
SELECT
  id,
  user_id,
  category_id,
  CASE
    WHEN description_encrypted IS NOT NULL THEN
      pgp_sym_decrypt(
        description_encrypted,
        private.get_encryption_key()
      )
    ELSE NULL
  END AS description,
  CASE
    WHEN amount_cents_encrypted IS NOT NULL THEN
      (pgp_sym_decrypt(
        amount_cents_encrypted,
        private.get_encryption_key()
      ))::INTEGER
    ELSE NULL
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
  created_at,
  updated_at
FROM private.expense_data;

-- Grant access to the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO service_role;

-- Recreate INSERT trigger to include credit_card_id
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
    created_at,
    updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
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
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  RETURNING id INTO new_id;

  NEW.id := new_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expense_insert ON public.expense;
CREATE TRIGGER expense_insert
  INSTEAD OF INSERT ON public.expense
  FOR EACH ROW
  EXECUTE FUNCTION private.expense_insert_trigger();

-- Recreate UPDATE trigger to include credit_card_id
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
    category_id = COALESCE(NEW.category_id, category_id),
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
    updated_at = NOW()
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expense_update ON public.expense;
CREATE TRIGGER expense_update
  INSTEAD OF UPDATE ON public.expense
  FOR EACH ROW
  EXECUTE FUNCTION private.expense_update_trigger();

-- DELETE trigger doesn't need changes, but recreate for safety
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

DROP TRIGGER IF EXISTS expense_delete ON public.expense;
CREATE TRIGGER expense_delete
  INSTEAD OF DELETE ON public.expense
  FOR EACH ROW
  EXECUTE FUNCTION private.expense_delete_trigger();

-- Grant execute on trigger functions
GRANT EXECUTE ON FUNCTION private.expense_insert_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION private.expense_update_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION private.expense_delete_trigger() TO authenticated;

COMMENT ON VIEW public.expense IS 'Transparent decrypting view for expenses with credit card support. Queries this like a regular table.';
