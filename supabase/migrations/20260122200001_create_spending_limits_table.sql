-- Create spending_limits table for monthly spending limits
-- Users set a limit for a specific month, with carry-over logic handled in application

CREATE TABLE public.spending_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,  -- Format: "2026-01"
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One limit per user per month
  UNIQUE(user_id, year_month)
);

-- Index for efficient queries (find most recent limit)
CREATE INDEX idx_spending_limit_user_month
  ON public.spending_limit(user_id, year_month DESC);

-- Enable RLS
ALTER TABLE public.spending_limit ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own spending limits"
  ON public.spending_limit FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spending limits"
  ON public.spending_limit FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spending limits"
  ON public.spending_limit FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spending limits"
  ON public.spending_limit FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE TRIGGER spending_limit_updated_at
  BEFORE UPDATE ON public.spending_limit
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spending_limit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spending_limit TO service_role;

COMMENT ON TABLE public.spending_limit IS 'Monthly spending limits per user. Carry-over logic handled in application.';
COMMENT ON COLUMN public.spending_limit.year_month IS 'Month in YYYY-MM format (e.g., 2026-01)';
COMMENT ON COLUMN public.spending_limit.amount_cents IS 'Spending limit in centavos';
