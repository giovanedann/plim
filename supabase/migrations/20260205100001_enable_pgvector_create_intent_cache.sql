-- Migration: Enable pgvector and create intent_cache table
-- Description: Core infrastructure for semantic intent caching to reduce AI costs

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create intent_cache table for storing embedded intents
CREATE TABLE IF NOT EXISTS public.intent_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_text TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  function_name TEXT NOT NULL,
  params_template JSONB NOT NULL DEFAULT '{}',
  extraction_hints TEXT,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create HNSW index for fast cosine similarity search
CREATE INDEX intent_cache_embedding_idx
  ON public.intent_cache
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index on function_name for filtering
CREATE INDEX intent_cache_function_name_idx
  ON public.intent_cache(function_name);

-- Index on usage_count for cleanup queries
CREATE INDEX intent_cache_usage_count_idx
  ON public.intent_cache(usage_count);

-- Enable RLS
ALTER TABLE public.intent_cache ENABLE ROW LEVEL SECURITY;

-- Intent cache is global (not per-user), so only service_role can write
-- All authenticated users can read (intents are universal)
CREATE POLICY "Authenticated users can read intent cache"
  ON public.intent_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_intent_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intent_cache_updated_at
  BEFORE UPDATE ON public.intent_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_intent_cache_updated_at();

-- Add comments
COMMENT ON TABLE public.intent_cache IS 'Global cache mapping user intents to AI function calls via vector embeddings';
COMMENT ON COLUMN public.intent_cache.canonical_text IS 'Representative text for this intent (e.g. "quanto gastei esse mes")';
COMMENT ON COLUMN public.intent_cache.embedding IS '768-dimensional embedding from Gemini text-embedding-004';
COMMENT ON COLUMN public.intent_cache.function_name IS 'The AI function to call (e.g. query_data, create_expense)';
COMMENT ON COLUMN public.intent_cache.params_template IS 'Template for function parameters with placeholders for dynamic values';
COMMENT ON COLUMN public.intent_cache.extraction_hints IS 'Hints for extracting dynamic params from user query';
COMMENT ON COLUMN public.intent_cache.usage_count IS 'Number of times this cached intent has been used';
