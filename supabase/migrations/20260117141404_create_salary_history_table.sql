-- Salary history table
CREATE TABLE public.salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure no duplicate effective dates per user
  UNIQUE (user_id, effective_from)
);

-- Enable RLS
ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;

-- Index for finding active salary for a date
CREATE INDEX idx_salary_history_user_effective ON public.salary_history(user_id, effective_from DESC);

-- Comments
COMMENT ON TABLE public.salary_history IS 'Salary history for tracking income changes over time';
COMMENT ON COLUMN public.salary_history.amount_cents IS 'Monthly salary in centavos';
COMMENT ON COLUMN public.salary_history.effective_from IS 'Date when this salary amount became effective';
