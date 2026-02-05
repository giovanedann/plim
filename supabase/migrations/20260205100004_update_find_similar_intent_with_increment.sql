-- Update find_similar_intent to auto-increment usage_count on match
CREATE OR REPLACE FUNCTION public.find_similar_intent(
  query_embedding vector(768),
  similarity_threshold FLOAT DEFAULT 0.92,
  max_results INT DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  canonical_text TEXT,
  function_name TEXT,
  params_template JSONB,
  extraction_hints TEXT,
  usage_count INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_id UUID;
BEGIN
  RETURN QUERY
  SELECT
    ic.id,
    ic.canonical_text,
    ic.function_name,
    ic.params_template,
    ic.extraction_hints,
    ic.usage_count,
    (1 - (ic.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.intent_cache ic
  WHERE (1 - (ic.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY ic.embedding <=> query_embedding ASC
  LIMIT max_results;

  -- Increment usage_count for the best match
  SELECT ic.id INTO matched_id
  FROM public.intent_cache ic
  WHERE (1 - (ic.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY ic.embedding <=> query_embedding ASC
  LIMIT 1;

  IF matched_id IS NOT NULL THEN
    UPDATE public.intent_cache SET usage_count = intent_cache.usage_count + 1 WHERE intent_cache.id = matched_id;
  END IF;
END;
$$;
