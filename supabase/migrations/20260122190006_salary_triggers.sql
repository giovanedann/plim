-- Migration 6: Create INSTEAD OF triggers for salary_history view
-- Plus the upsert_salary RPC function for handling upsert operations

-- ================================================================
-- INSERT TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION private.salary_history_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Enforce CHECK constraint: amount_cents >= 0
  IF NEW.amount_cents IS NULL OR NEW.amount_cents < 0 THEN
    RAISE EXCEPTION 'amount_cents must be greater than or equal to 0';
  END IF;

  INSERT INTO private.salary_history_data (
    id,
    user_id,
    amount_cents_encrypted,
    effective_from,
    created_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    pgp_sym_encrypt(
      NEW.amount_cents::TEXT,
      private.get_encryption_key(),
      'compress-algo=1, cipher-algo=aes256'
    ),
    NEW.effective_from,
    COALESCE(NEW.created_at, NOW())
  )
  RETURNING id INTO new_id;

  NEW.id := new_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER salary_history_insert
  INSTEAD OF INSERT ON public.salary_history
  FOR EACH ROW
  EXECUTE FUNCTION private.salary_history_insert_trigger();

-- ================================================================
-- UPDATE TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION private.salary_history_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
BEGIN
  -- Enforce CHECK constraint if amount_cents is being updated
  IF NEW.amount_cents IS NOT NULL AND NEW.amount_cents < 0 THEN
    RAISE EXCEPTION 'amount_cents must be greater than or equal to 0';
  END IF;

  UPDATE private.salary_history_data
  SET
    amount_cents_encrypted = CASE
      WHEN NEW.amount_cents IS NOT NULL AND NEW.amount_cents != OLD.amount_cents THEN
        pgp_sym_encrypt(
          NEW.amount_cents::TEXT,
          private.get_encryption_key(),
          'compress-algo=1, cipher-algo=aes256'
        )
      ELSE amount_cents_encrypted
    END,
    effective_from = COALESCE(NEW.effective_from, effective_from)
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER salary_history_update
  INSTEAD OF UPDATE ON public.salary_history
  FOR EACH ROW
  EXECUTE FUNCTION private.salary_history_update_trigger();

-- ================================================================
-- DELETE TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION private.salary_history_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  DELETE FROM private.salary_history_data WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER salary_history_delete
  INSTEAD OF DELETE ON public.salary_history
  FOR EACH ROW
  EXECUTE FUNCTION private.salary_history_delete_trigger();

-- Grant execute on trigger functions
GRANT EXECUTE ON FUNCTION private.salary_history_insert_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION private.salary_history_update_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION private.salary_history_delete_trigger() TO authenticated;

-- ================================================================
-- UPSERT_SALARY RPC FUNCTION
-- This handles the upsert logic that views can't support directly
-- ================================================================
CREATE OR REPLACE FUNCTION public.upsert_salary(
  p_user_id UUID,
  p_amount_cents INTEGER,
  p_effective_from DATE
)
RETURNS public.salary_history
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, extensions
AS $$
DECLARE
  result_record public.salary_history;
  existing_id UUID;
BEGIN
  -- Enforce CHECK constraint
  IF p_amount_cents < 0 THEN
    RAISE EXCEPTION 'amount_cents must be greater than or equal to 0';
  END IF;

  -- Verify the user is authorized (matches auth.uid())
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify salary for another user';
  END IF;

  -- Check if record exists
  SELECT id INTO existing_id
  FROM private.salary_history_data
  WHERE user_id = p_user_id AND effective_from = p_effective_from;

  IF existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE private.salary_history_data
    SET amount_cents_encrypted = pgp_sym_encrypt(
      p_amount_cents::TEXT,
      private.get_encryption_key(),
      'compress-algo=1, cipher-algo=aes256'
    )
    WHERE id = existing_id;
  ELSE
    -- Insert new record
    INSERT INTO private.salary_history_data (
      user_id,
      amount_cents_encrypted,
      effective_from
    ) VALUES (
      p_user_id,
      pgp_sym_encrypt(
        p_amount_cents::TEXT,
        private.get_encryption_key(),
        'compress-algo=1, cipher-algo=aes256'
      ),
      p_effective_from
    )
    RETURNING id INTO existing_id;
  END IF;

  -- Return the full record via the view
  SELECT * INTO result_record
  FROM public.salary_history
  WHERE id = existing_id;

  RETURN result_record;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_salary(UUID, INTEGER, DATE) TO authenticated;

COMMENT ON FUNCTION public.upsert_salary IS 'Upsert salary record with automatic encryption. Use this instead of direct INSERT with ON CONFLICT since views do not support that syntax.';
