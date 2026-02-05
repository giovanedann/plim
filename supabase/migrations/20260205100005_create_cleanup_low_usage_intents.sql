-- Function to clean up low-usage intent cache entries
-- Removes intents with usage_count below threshold that are older than min_age
CREATE OR REPLACE FUNCTION public.cleanup_low_usage_intents(
  min_usage INTEGER DEFAULT 2,
  min_age_days INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.intent_cache
  WHERE usage_count < min_usage
    AND created_at < (now() - (min_age_days || ' days')::INTERVAL);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_low_usage_intents IS 'Remove rarely-used cached intents older than min_age_days to prevent cache bloat';
