-- Create function to extend recurrent expense groups
-- This function can be scheduled via pg_cron to run monthly

CREATE OR REPLACE FUNCTION public.extend_recurrent_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  rec RECORD;
  latest_date DATE;
  target_date DATE;
  end_boundary DATE;
  month_offset INTEGER;
BEGIN
  -- Find all recurrent groups that need extension
  -- Groups where the latest record is within 6 months from now
  FOR rec IN
    WITH group_latest AS (
      SELECT
        recurrent_group_id,
        MAX(date) as latest_date,
        MAX(recurrence_day) as recurrence_day,
        MAX(recurrence_end) as recurrence_end,
        MAX(user_id) as user_id,
        MAX(category_id) as category_id,
        MAX(description_encrypted) as description_encrypted,
        MAX(amount_cents_encrypted) as amount_cents_encrypted,
        MAX(payment_method::text) as payment_method,
        MAX(recurrence_start) as recurrence_start,
        MAX(credit_card_id) as credit_card_id
      FROM private.expense_data
      WHERE recurrent_group_id IS NOT NULL
      AND is_recurrent = true
      GROUP BY recurrent_group_id
    )
    SELECT * FROM group_latest
    WHERE latest_date <= CURRENT_DATE + INTERVAL '6 months'
    AND (recurrence_end IS NULL OR recurrence_end > latest_date)
  LOOP
    -- Calculate end boundary: 2 years from now or recurrence_end, whichever is earlier
    IF rec.recurrence_end IS NOT NULL THEN
      end_boundary := LEAST(rec.recurrence_end, CURRENT_DATE + INTERVAL '2 years');
    ELSE
      end_boundary := CURRENT_DATE + INTERVAL '2 years';
    END IF;

    -- Generate new records from the month after the latest one
    latest_date := rec.latest_date;
    month_offset := 1;

    WHILE TRUE LOOP
      target_date := (DATE_TRUNC('month', latest_date) + month_offset * INTERVAL '1 month' + (rec.recurrence_day - 1) * INTERVAL '1 day')::DATE;

      -- Handle months with fewer days
      IF EXTRACT(DAY FROM target_date) != rec.recurrence_day THEN
        target_date := (DATE_TRUNC('month', target_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
      END IF;

      -- Exit if we've passed the end boundary
      EXIT WHEN target_date > end_boundary;

      -- Insert new materialized record
      INSERT INTO private.expense_data (
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
        credit_card_id,
        recurrent_group_id
      ) VALUES (
        rec.user_id,
        rec.category_id,
        rec.description_encrypted,
        rec.amount_cents_encrypted,
        rec.payment_method::payment_method,
        target_date,
        true,
        rec.recurrence_day,
        rec.recurrence_start,
        rec.recurrence_end,
        rec.credit_card_id,
        rec.recurrent_group_id
      );

      month_offset := month_offset + 1;
    END LOOP;
  END LOOP;
END $$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.extend_recurrent_expenses() TO service_role;

-- Add comment explaining the function
COMMENT ON FUNCTION public.extend_recurrent_expenses() IS 'Extends recurrent expense groups by creating materialized records up to 2 years ahead. Can be scheduled via pg_cron to run monthly with: SELECT cron.schedule(''extend-recurrent-expenses'', ''0 0 1 * *'', ''SELECT public.extend_recurrent_expenses()'');';

-- To enable pg_cron and schedule the job:
-- 1. Enable pg_cron in Supabase Dashboard > Database > Extensions
-- 2. Run: SELECT cron.schedule('extend-recurrent-expenses', '0 0 1 * *', 'SELECT public.extend_recurrent_expenses()');
