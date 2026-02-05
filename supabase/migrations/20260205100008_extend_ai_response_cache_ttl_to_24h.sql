ALTER TABLE public.ai_response_cache
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');
