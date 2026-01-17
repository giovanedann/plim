-- Payment method enum
CREATE TYPE public.payment_method AS ENUM ('credit_card', 'debit_card', 'pix', 'cash');

-- Expense table
CREATE TABLE public.expense (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.category(id),
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method public.payment_method NOT NULL,
  date DATE NOT NULL,
  is_recurrent BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_day INTEGER CHECK (recurrence_day >= 1 AND recurrence_day <= 31),
  recurrence_start DATE,
  recurrence_end DATE,
  installment_current INTEGER CHECK (installment_current >= 1),
  installment_total INTEGER CHECK (installment_total >= 1),
  installment_group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_recurrence CHECK (
    (is_recurrent = FALSE) OR
    (is_recurrent = TRUE AND recurrence_day IS NOT NULL AND recurrence_start IS NOT NULL)
  ),
  CONSTRAINT valid_installment CHECK (
    (installment_current IS NULL AND installment_total IS NULL AND installment_group_id IS NULL) OR
    (installment_current IS NOT NULL AND installment_total IS NOT NULL AND installment_group_id IS NOT NULL AND installment_current <= installment_total)
  )
);

-- Enable RLS
ALTER TABLE public.expense ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-update updated_at
CREATE TRIGGER expense_updated_at
  BEFORE UPDATE ON public.expense
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes for common queries
CREATE INDEX idx_expense_user_date ON public.expense(user_id, date);
CREATE INDEX idx_expense_installment_group ON public.expense(installment_group_id) WHERE installment_group_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.expense IS 'User expenses with support for one-time, recurrent, and installment payments';
COMMENT ON COLUMN public.expense.amount_cents IS 'Amount in centavos (R$55.90 = 5590)';
COMMENT ON COLUMN public.expense.installment_group_id IS 'Groups all installments of the same purchase together';
