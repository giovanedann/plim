-- Migration: Create invoice table with encrypted monetary fields
-- Tracks monthly credit card invoices with billing cycles and payment status

-- ================================================================
-- 1. Create invoice_status enum
-- ================================================================
CREATE TYPE public.invoice_status AS ENUM ('open', 'partially_paid', 'paid');

-- ================================================================
-- 2. Create private base table with encrypted monetary fields
-- ================================================================
CREATE TABLE private.invoice_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id UUID NOT NULL REFERENCES private.credit_card_data(id) ON DELETE CASCADE,
  reference_month TEXT NOT NULL,
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,
  total_amount_cents_encrypted BYTEA,
  paid_amount_cents_encrypted BYTEA,
  carry_over_cents_encrypted BYTEA,
  status public.invoice_status NOT NULL DEFAULT 'open',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT invoice_unique_card_month UNIQUE (user_id, credit_card_id, reference_month)
);

-- ================================================================
-- 3. Enable RLS + create policies
-- ================================================================
ALTER TABLE private.invoice_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
  ON private.invoice_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
  ON private.invoice_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON private.invoice_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON private.invoice_data FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- 4. Create indexes
-- ================================================================
CREATE INDEX idx_invoice_data_card_month
  ON private.invoice_data(user_id, credit_card_id, reference_month);

CREATE INDEX idx_invoice_data_card_status
  ON private.invoice_data(credit_card_id, status);

-- ================================================================
-- 5. Grant access on base table
-- ================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON private.invoice_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.invoice_data TO service_role;

-- ================================================================
-- 6. Create decrypting view
-- ================================================================
CREATE VIEW public.invoice WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  credit_card_id,
  reference_month,
  cycle_start,
  cycle_end,
  CASE
    WHEN total_amount_cents_encrypted IS NOT NULL THEN
      pgp_sym_decrypt(
        total_amount_cents_encrypted,
        private.get_encryption_key()
      )::INTEGER
    ELSE NULL
  END AS total_amount_cents,
  CASE
    WHEN paid_amount_cents_encrypted IS NOT NULL THEN
      pgp_sym_decrypt(
        paid_amount_cents_encrypted,
        private.get_encryption_key()
      )::INTEGER
    ELSE NULL
  END AS paid_amount_cents,
  CASE
    WHEN carry_over_cents_encrypted IS NOT NULL THEN
      pgp_sym_decrypt(
        carry_over_cents_encrypted,
        private.get_encryption_key()
      )::INTEGER
    ELSE NULL
  END AS carry_over_cents,
  status,
  paid_at,
  created_at,
  updated_at
FROM private.invoice_data;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice TO service_role;

-- ================================================================
-- 7. INSTEAD OF INSERT trigger
-- ================================================================
CREATE OR REPLACE FUNCTION private.invoice_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO private.invoice_data (
    id,
    user_id,
    credit_card_id,
    reference_month,
    cycle_start,
    cycle_end,
    total_amount_cents_encrypted,
    paid_amount_cents_encrypted,
    carry_over_cents_encrypted,
    status,
    paid_at,
    created_at,
    updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.credit_card_id,
    NEW.reference_month,
    NEW.cycle_start,
    NEW.cycle_end,
    CASE
      WHEN NEW.total_amount_cents IS NOT NULL THEN
        pgp_sym_encrypt(
          NEW.total_amount_cents::TEXT,
          private.get_encryption_key(),
          'compress-algo=1, cipher-algo=aes256'
        )
      ELSE NULL
    END,
    CASE
      WHEN NEW.paid_amount_cents IS NOT NULL THEN
        pgp_sym_encrypt(
          NEW.paid_amount_cents::TEXT,
          private.get_encryption_key(),
          'compress-algo=1, cipher-algo=aes256'
        )
      ELSE NULL
    END,
    CASE
      WHEN NEW.carry_over_cents IS NOT NULL THEN
        pgp_sym_encrypt(
          NEW.carry_over_cents::TEXT,
          private.get_encryption_key(),
          'compress-algo=1, cipher-algo=aes256'
        )
      ELSE NULL
    END,
    COALESCE(NEW.status, 'open'),
    NEW.paid_at,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  RETURNING id INTO new_id;

  NEW.id := new_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_insert
  INSTEAD OF INSERT ON public.invoice
  FOR EACH ROW
  EXECUTE FUNCTION private.invoice_insert_trigger();

-- ================================================================
-- 8. INSTEAD OF UPDATE trigger
-- ================================================================
CREATE OR REPLACE FUNCTION private.invoice_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
BEGIN
  UPDATE private.invoice_data
  SET
    reference_month = COALESCE(NEW.reference_month, reference_month),
    cycle_start = COALESCE(NEW.cycle_start, cycle_start),
    cycle_end = COALESCE(NEW.cycle_end, cycle_end),
    total_amount_cents_encrypted = CASE
      WHEN NEW.total_amount_cents IS DISTINCT FROM OLD.total_amount_cents THEN
        CASE
          WHEN NEW.total_amount_cents IS NOT NULL THEN
            pgp_sym_encrypt(
              NEW.total_amount_cents::TEXT,
              private.get_encryption_key(),
              'compress-algo=1, cipher-algo=aes256'
            )
          ELSE NULL
        END
      ELSE total_amount_cents_encrypted
    END,
    paid_amount_cents_encrypted = CASE
      WHEN NEW.paid_amount_cents IS DISTINCT FROM OLD.paid_amount_cents THEN
        CASE
          WHEN NEW.paid_amount_cents IS NOT NULL THEN
            pgp_sym_encrypt(
              NEW.paid_amount_cents::TEXT,
              private.get_encryption_key(),
              'compress-algo=1, cipher-algo=aes256'
            )
          ELSE NULL
        END
      ELSE paid_amount_cents_encrypted
    END,
    carry_over_cents_encrypted = CASE
      WHEN NEW.carry_over_cents IS DISTINCT FROM OLD.carry_over_cents THEN
        CASE
          WHEN NEW.carry_over_cents IS NOT NULL THEN
            pgp_sym_encrypt(
              NEW.carry_over_cents::TEXT,
              private.get_encryption_key(),
              'compress-algo=1, cipher-algo=aes256'
            )
          ELSE NULL
        END
      ELSE carry_over_cents_encrypted
    END,
    status = COALESCE(NEW.status, status),
    paid_at = NEW.paid_at,
    updated_at = NOW()
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_update
  INSTEAD OF UPDATE ON public.invoice
  FOR EACH ROW
  EXECUTE FUNCTION private.invoice_update_trigger();

-- ================================================================
-- 9. INSTEAD OF DELETE trigger
-- ================================================================
CREATE OR REPLACE FUNCTION private.invoice_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
BEGIN
  DELETE FROM private.invoice_data WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER invoice_delete
  INSTEAD OF DELETE ON public.invoice
  FOR EACH ROW
  EXECUTE FUNCTION private.invoice_delete_trigger();
