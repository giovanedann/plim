-- Add invoice_id to expense_data for linking remainder expenses to invoices.
-- When a billing cycle closes with unpaid balance, a remainder expense is created
-- and linked to the invoice via this column.

-- ================================================================
-- STEP 1: Add invoice_id column to the underlying base table
-- ================================================================
ALTER TABLE private.expense_data
  ADD COLUMN invoice_id UUID REFERENCES private.invoice_data(id) ON DELETE SET NULL;

-- ================================================================
-- STEP 2: Update category constraint
-- Expenses need a category unless they are invoice remainders.
-- ================================================================
ALTER TABLE private.expense_data DROP CONSTRAINT expense_category_check;

ALTER TABLE private.expense_data ADD CONSTRAINT expense_category_check CHECK (
  (type = 'expense' AND category_id IS NOT NULL AND invoice_id IS NULL) OR
  (type = 'expense' AND invoice_id IS NOT NULL) OR
  (type = 'income')
);

-- ================================================================
-- STEP 3: Add partial index for invoice_id lookups
-- ================================================================
CREATE INDEX idx_expense_data_invoice_id ON private.expense_data(invoice_id) WHERE invoice_id IS NOT NULL;

COMMENT ON COLUMN private.expense_data.invoice_id IS 'Links remainder expenses to their source invoice';

-- ================================================================
-- STEP 4: Recreate the expense view to include invoice_id
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
    invoice_id,
    created_at,
    updated_at
FROM private.expense_data;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO service_role;

COMMENT ON VIEW public.expense IS 'Transparent decrypting view for expenses and incomes. invoice_id links remainder expenses to invoices.';

-- ================================================================
-- STEP 5: Recreate INSERT trigger to handle invoice_id
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
    invoice_id,
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
    NEW.invoice_id,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  RETURNING id INTO new_id;

  NEW.id := new_id;
  RETURN NEW;
END;
$$;

-- ================================================================
-- STEP 6: Recreate UPDATE trigger to handle invoice_id
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
    invoice_id = NEW.invoice_id,
    updated_at = NOW()
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

-- ================================================================
-- STEP 7: Recreate INSTEAD OF triggers on the view
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
