-- Migration: Add tiered rate limits by request type
-- Description: Separate limits for text, voice, and image AI requests

-- Add new columns for per-type limits
ALTER TABLE public.subscription
ADD COLUMN IF NOT EXISTS ai_text_limit INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS ai_voice_limit INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS ai_image_limit INTEGER NOT NULL DEFAULT 5;

-- Update existing subscriptions based on tier
UPDATE public.subscription
SET
  ai_text_limit = CASE tier
    WHEN 'free' THEN 50
    WHEN 'pro' THEN 500
    WHEN 'unlimited' THEN 999999
    ELSE 50
  END,
  ai_voice_limit = CASE tier
    WHEN 'free' THEN 10
    WHEN 'pro' THEN 100
    WHEN 'unlimited' THEN 999999
    ELSE 10
  END,
  ai_image_limit = CASE tier
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 50
    WHEN 'unlimited' THEN 999999
    ELSE 5
  END;

-- Update the trigger to also set these limits on subscription creation
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.subscription (
    user_id,
    tier,
    ai_requests_limit,
    ai_text_limit,
    ai_voice_limit,
    ai_image_limit
  )
  VALUES (
    NEW.id,
    'free',
    30,  -- Legacy total limit (kept for backwards compatibility)
    50,  -- Text messages per month
    10,  -- Voice messages per month
    5    -- Image messages per month
  );
  RETURN NEW;
END;
$$;

-- Add comments
COMMENT ON COLUMN public.subscription.ai_text_limit IS 'Monthly limit for text-based AI requests';
COMMENT ON COLUMN public.subscription.ai_voice_limit IS 'Monthly limit for voice-based AI requests';
COMMENT ON COLUMN public.subscription.ai_image_limit IS 'Monthly limit for image-based AI requests';
