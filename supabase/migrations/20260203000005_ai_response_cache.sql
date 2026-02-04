-- Migration: Add AI response cache table
-- Description: Hash-based caching for AI responses to reduce costs

CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('text', 'voice', 'image')),
  response_message TEXT NOT NULL,
  response_action JSONB,
  tokens_saved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Unique constraint on user + cache key
CREATE UNIQUE INDEX IF NOT EXISTS ai_response_cache_user_key_idx
  ON public.ai_response_cache(user_id, cache_key);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS ai_response_cache_expires_idx
  ON public.ai_response_cache(expires_at);

-- Enable RLS
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Users can only access their own cache
CREATE POLICY "Users can read own cache"
  ON public.ai_response_cache
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
  ON public.ai_response_cache
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cache"
  ON public.ai_response_cache
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_response_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Add comment
COMMENT ON TABLE public.ai_response_cache IS 'Cache for AI responses to reduce API costs. Entries expire after 1 hour.';
