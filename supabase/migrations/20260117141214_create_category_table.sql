-- Category table
CREATE TABLE public.category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-update updated_at
CREATE TRIGGER category_updated_at
  BEFORE UPDATE ON public.category
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index for fetching user's categories
CREATE INDEX idx_category_user_id ON public.category(user_id);

-- Comment
COMMENT ON TABLE public.category IS 'Expense categories. user_id NULL = system default category';
COMMENT ON COLUMN public.category.user_id IS 'NULL means system default category visible to all users';
