-- Add recurrent_group_id column to the underlying expense_data table
ALTER TABLE private.expense_data ADD COLUMN recurrent_group_id UUID;

-- Create index for efficient group lookups (only for non-null values)
CREATE INDEX idx_expense_recurrent_group ON private.expense_data(recurrent_group_id) WHERE recurrent_group_id IS NOT NULL;

-- Add comment explaining the purpose
COMMENT ON COLUMN private.expense_data.recurrent_group_id IS 'Groups all materialized instances of a recurrent expense together';

-- Drop and recreate the expense view to include the new column
DROP VIEW IF EXISTS public.expense;

CREATE VIEW public.expense WITH (security_invoker = true) AS
SELECT
    id,
    user_id,
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
