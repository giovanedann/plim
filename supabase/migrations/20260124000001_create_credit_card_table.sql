-- Migration: Create credit_card table
-- Credit cards are used to organize expenses by card, not for actual payments
-- Only last_4_digits is encrypted since it's optional sensitive data

-- Create the base table in private schema for encryption
CREATE TABLE private.credit_card_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  flag TEXT NOT NULL,
  bank TEXT NOT NULL,
  last_4_digits_encrypted BYTEA,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_card_data_user_id ON private.credit_card_data(user_id);

-- Create the public view with auto-decryption
CREATE VIEW public.credit_card AS
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
  is_active,
  created_at,
  updated_at
FROM private.credit_card_data;

-- Grant access to the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card TO authenticated;

-- ================================================================
-- INSERT TRIGGER
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
    COALESCE(NEW.is_active, TRUE),
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  RETURNING id INTO new_id;

  NEW.id := new_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER credit_card_insert
  INSTEAD OF INSERT ON public.credit_card
  FOR EACH ROW
  EXECUTE FUNCTION private.credit_card_insert_trigger();

-- ================================================================
-- UPDATE TRIGGER
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
    is_active = COALESCE(NEW.is_active, is_active),
    updated_at = NOW()
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER credit_card_update
  INSTEAD OF UPDATE ON public.credit_card
  FOR EACH ROW
  EXECUTE FUNCTION private.credit_card_update_trigger();

-- ================================================================
-- DELETE TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION private.credit_card_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  DELETE FROM private.credit_card_data WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER credit_card_delete
  INSTEAD OF DELETE ON public.credit_card
  FOR EACH ROW
  EXECUTE FUNCTION private.credit_card_delete_trigger();

-- Grant execute on trigger functions
GRANT EXECUTE ON FUNCTION private.credit_card_insert_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION private.credit_card_update_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION private.credit_card_delete_trigger() TO authenticated;

-- ================================================================
-- RLS POLICIES
-- ================================================================
ALTER TABLE private.credit_card_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit cards"
  ON private.credit_card_data
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own credit cards"
  ON private.credit_card_data
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own credit cards"
  ON private.credit_card_data
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own credit cards"
  ON private.credit_card_data
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
