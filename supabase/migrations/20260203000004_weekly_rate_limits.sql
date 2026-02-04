-- Migration: Change rate limits from monthly to weekly
-- Description: Update limits to be weekly instead of monthly for better UX

-- Update existing subscriptions with new weekly limits
UPDATE public.subscription
SET
  ai_requests_limit = CASE tier
    WHEN 'free' THEN 40
    WHEN 'pro' THEN 195
    WHEN 'unlimited' THEN 999999
    ELSE 40
  END,
  ai_text_limit = CASE tier
    WHEN 'free' THEN 30
    WHEN 'pro' THEN 150
    WHEN 'unlimited' THEN 999999
    ELSE 30
  END,
  ai_voice_limit = CASE tier
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 30
    WHEN 'unlimited' THEN 999999
    ELSE 5
  END,
  ai_image_limit = CASE tier
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 15
    WHEN 'unlimited' THEN 999999
    ELSE 5
  END;

-- Update the trigger to use weekly limits for new users
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
    40,  -- Total weekly limit (legacy)
    30,  -- Text messages per week
    5,   -- Voice messages per week
    5    -- Image messages per week
  );
  RETURN NEW;
END;
$$;

-- Update comments to reflect weekly limits
COMMENT ON COLUMN public.subscription.ai_text_limit IS 'Weekly limit for text-based AI requests';
COMMENT ON COLUMN public.subscription.ai_voice_limit IS 'Weekly limit for voice-based AI requests';
COMMENT ON COLUMN public.subscription.ai_image_limit IS 'Weekly limit for image-based AI requests';
