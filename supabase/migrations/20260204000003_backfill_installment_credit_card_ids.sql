-- Backfill credit_card_id for installment expenses
-- Some installment groups may have credit_card_id set on only one expense
-- This migration propagates the credit_card_id to all expenses in the same group

-- Update expenses where:
-- 1. They belong to an installment group (installment_group_id is not null)
-- 2. Their credit_card_id is null
-- 3. Another expense in the same group has a credit_card_id

UPDATE expense e
SET
  credit_card_id = (
    SELECT e2.credit_card_id
    FROM expense e2
    WHERE e2.installment_group_id = e.installment_group_id
      AND e2.credit_card_id IS NOT NULL
    LIMIT 1
  ),
  updated_at = NOW()
WHERE e.installment_group_id IS NOT NULL
  AND e.credit_card_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM expense e3
    WHERE e3.installment_group_id = e.installment_group_id
      AND e3.credit_card_id IS NOT NULL
  );
