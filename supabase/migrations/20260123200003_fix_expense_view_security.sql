-- Migration: Fix expense view security invoker setting
-- Restores security_invoker = true that was lost in description encryption migration

DROP VIEW IF EXISTS public.expense CASCADE;

CREATE VIEW public.expense
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  category_id,
  pgp_sym_decrypt(
    description_encrypted,
    private.get_encryption_key()
  ) AS description,
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense TO service_role;

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

COMMENT ON VIEW public.expense IS 'Transparent decrypting view for expenses. Both amount_cents and description are encrypted at rest.';
