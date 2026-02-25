-- Migration: Add closing_day and credit_limit_cents to credit_card
-- closing_day = day of month when billing cycle closes (1-31)
-- credit_limit_cents = encrypted credit limit in centavos

-- ================================================================
-- 1. Add columns to base table with constraints
-- ================================================================
ALTER TABLE private.credit_card_data ADD COLUMN closing_day INTEGER;

ALTER TABLE private.credit_card_data ADD CONSTRAINT credit_card_closing_day_check
  CHECK (closing_day IS NULL OR (closing_day >= 1 AND closing_day <= 31));

ALTER TABLE private.credit_card_data ADD COLUMN credit_limit_cents_encrypted BYTEA;

-- ================================================================
-- 2. Drop and recreate view to include new columns
-- ================================================================
DROP VIEW IF EXISTS public.credit_card;

CREATE VIEW public.credit_card WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  name,
  color,
  flag,
  bank,
  CASE
    WHEN last_4_digits_encrypted IS NOT NULL THEN
      pgp_sym_decrypt(
        last_4_digits_encrypted,
        private.get_encryption_key()
      )
    ELSE NULL
  END AS last_4_digits,
  expiration_day,
  closing_day,
  CASE
    WHEN credit_limit_cents_encrypted IS NOT NULL THEN
      pgp_sym_decrypt(
        credit_limit_cents_encrypted,
        private.get_encryption_key()
      )::INTEGER
    ELSE NULL
  END AS credit_limit_cents,
  is_active,
  created_at,
  updated_at
FROM private.credit_card_data;

-- Restore grants (dropped with the view)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card TO service_role;

-- ================================================================
-- 3. Update INSERT trigger to include new columns
-- ================================================================
CREATE OR REPLACE FUNCTION private.credit_card_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO private.credit_card_data (
    id,
    user_id,
    name,
    color,
    flag,
    bank,
    last_4_digits_encrypted,
    expiration_day,
    closing_day,
    credit_limit_cents_encrypted,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.name,
    NEW.color,
    NEW.flag,
    NEW.bank,
    CASE
      WHEN NEW.last_4_digits IS NOT NULL AND NEW.last_4_digits != '' THEN
        pgp_sym_encrypt(
          NEW.last_4_digits,
          private.get_encryption_key(),
          'compress-algo=1, cipher-algo=aes256'
        )
      ELSE NULL
    END,
    NEW.expiration_day,
    NEW.closing_day,
    CASE
      WHEN NEW.credit_limit_cents IS NOT NULL THEN
        pgp_sym_encrypt(
          NEW.credit_limit_cents::TEXT,
          private.get_encryption_key(),
          'compress-algo=1, cipher-algo=aes256'
        )
      ELSE NULL
    END,
    COALESCE(NEW.is_active, TRUE),
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  RETURNING id INTO new_id;

  NEW.id := new_id;
  RETURN NEW;
END;
$$;

-- ================================================================
-- 4. Update UPDATE trigger to include new columns
-- ================================================================
CREATE OR REPLACE FUNCTION private.credit_card_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
BEGIN
  UPDATE private.credit_card_data
  SET
    name = COALESCE(NEW.name, name),
    color = COALESCE(NEW.color, color),
    flag = COALESCE(NEW.flag, flag),
    bank = COALESCE(NEW.bank, bank),
    last_4_digits_encrypted = CASE
      WHEN NEW.last_4_digits IS DISTINCT FROM OLD.last_4_digits THEN
        CASE
          WHEN NEW.last_4_digits IS NOT NULL AND NEW.last_4_digits != '' THEN
            pgp_sym_encrypt(
              NEW.last_4_digits,
              private.get_encryption_key(),
              'compress-algo=1, cipher-algo=aes256'
            )
          ELSE NULL
        END
      ELSE last_4_digits_encrypted
    END,
    expiration_day = COALESCE(NEW.expiration_day, expiration_day),
    closing_day = COALESCE(NEW.closing_day, closing_day),
    credit_limit_cents_encrypted = CASE
      WHEN NEW.credit_limit_cents IS DISTINCT FROM OLD.credit_limit_cents THEN
        CASE
          WHEN NEW.credit_limit_cents IS NOT NULL THEN
            pgp_sym_encrypt(
              NEW.credit_limit_cents::TEXT,
              private.get_encryption_key(),
              'compress-algo=1, cipher-algo=aes256'
            )
          ELSE NULL
        END
      ELSE credit_limit_cents_encrypted
    END,
    is_active = COALESCE(NEW.is_active, is_active),
    updated_at = NOW()
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

-- ================================================================
-- 5. Recreate INSTEAD OF triggers (dropped with the view)
-- ================================================================
CREATE TRIGGER credit_card_insert
  INSTEAD OF INSERT ON public.credit_card
  FOR EACH ROW
  EXECUTE FUNCTION private.credit_card_insert_trigger();

CREATE TRIGGER credit_card_update
  INSTEAD OF UPDATE ON public.credit_card
  FOR EACH ROW
  EXECUTE FUNCTION private.credit_card_update_trigger();

CREATE TRIGGER credit_card_delete
  INSTEAD OF DELETE ON public.credit_card
  FOR EACH ROW
  EXECUTE FUNCTION private.credit_card_delete_trigger();
