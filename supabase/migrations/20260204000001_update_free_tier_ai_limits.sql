-- Migration: Update free tier AI limits
-- Sprint: SPRINT-11 - AI Optimization & Cost Control
--
-- Changes:
-- - Free tier: 20 total (15 text, 2 voice, 3 image)
-- - Updates default column values for new users
-- - Updates existing free tier users to new limits

-- Update subscription table column defaults for new users
ALTER TABLE public.subscription
  ALTER COLUMN ai_requests_limit SET DEFAULT 20,
  ALTER COLUMN ai_text_limit SET DEFAULT 15,
  ALTER COLUMN ai_voice_limit SET DEFAULT 2,
  ALTER COLUMN ai_image_limit SET DEFAULT 3;

-- Update existing free tier users to new limits
UPDATE public.subscription
SET
  ai_requests_limit = 20,
  ai_text_limit = 15,
  ai_voice_limit = 2,
  ai_image_limit = 3,
  updated_at = now()
WHERE tier = 'free';
