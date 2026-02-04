-- Backfill existing recurrent expenses by materializing them into 24 months of records
-- This migration transforms recurrent templates into actual expense records

DO $$
DECLARE
  rec RECORD;
  group_id UUID;
  current_dt DATE;
  target_date DATE;
  start_date DATE;
  end_date DATE;
  month_offset INTEGER;
BEGIN
  -- Process each recurrent expense template that hasn't been materialized yet
  FOR rec IN
    SELECT * FROM private.expense_data
    WHERE is_recurrent = true
    AND recurrent_group_id IS NULL
  LOOP
    -- Generate a new group ID for this recurrent expense
    group_id := gen_random_uuid();

    -- Calculate the date range: 24 months from recurrence_start (or 2 years back from today if start is older)
    current_dt := CURRENT_DATE;

    -- Start date is the later of: recurrence_start or 2 years ago
    start_date := GREATEST(rec.recurrence_start, current_dt - INTERVAL '2 years');

    -- End date is the earlier of: recurrence_end or 2 years from now
    IF rec.recurrence_end IS NOT NULL THEN
      end_date := LEAST(rec.recurrence_end, current_dt + INTERVAL '2 years');
    ELSE
      end_date := current_dt + INTERVAL '2 years';
    END IF;

    -- Update the original record with the group_id (this becomes part of the group)
    UPDATE private.expense_data
    SET recurrent_group_id = group_id,
        date = (DATE_TRUNC('month', start_date) + (rec.recurrence_day - 1) * INTERVAL '1 day')::DATE
    WHERE id = rec.id;

    -- Generate materialized records for each month in the range
    month_offset := 1;
    WHILE TRUE LOOP
      target_date := (DATE_TRUNC('month', start_date) + month_offset * INTERVAL '1 month' + (rec.recurrence_day - 1) * INTERVAL '1 day')::DATE;

      -- Handle months with fewer days (e.g., Feb 30 -> Feb 28)
      IF EXTRACT(DAY FROM target_date) != rec.recurrence_day THEN
        target_date := (DATE_TRUNC('month', target_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
      END IF;

      -- Exit if we've passed the end date
      EXIT WHEN target_date > end_date;

      -- Insert materialized record
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
        rec.payment_method,
        target_date,
        true,
        rec.recurrence_day,
        rec.recurrence_start,
        rec.recurrence_end,
        rec.credit_card_id,
        group_id
      );

      month_offset := month_offset + 1;
    END LOOP;
  END LOOP;
END $$;
