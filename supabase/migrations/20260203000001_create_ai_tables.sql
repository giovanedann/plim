-- Migration: Create AI usage tracking and subscription tables
-- Description: Tables for tracking AI assistant usage and user subscription tiers

-- Create subscription table (must be created first as ai_usage may reference it)
CREATE TABLE IF NOT EXISTS public.subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'unlimited')),
  ai_requests_limit INTEGER NOT NULL DEFAULT 30,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_usage table
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('text', 'voice', 'image')),
  action_type TEXT,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient monthly usage aggregation
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_monthly
  ON public.ai_usage(user_id, created_at DESC);

-- Enable RLS on both tables
ALTER TABLE public.subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view own subscription"
  ON public.subscription
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscription
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscription
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- AI usage policies
CREATE POLICY "Users can view own usage"
  ON public.ai_usage
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.ai_usage
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Create trigger to update subscription.updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON public.subscription
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.subscription IS 'User subscription tiers for AI assistant usage limits';
COMMENT ON TABLE public.ai_usage IS 'Tracks individual AI assistant requests for billing and rate limiting';
COMMENT ON COLUMN public.subscription.tier IS 'Subscription tier: free (30/month), pro (300/month), unlimited';
COMMENT ON COLUMN public.ai_usage.request_type IS 'Input type: text, voice, or image';
COMMENT ON COLUMN public.ai_usage.action_type IS 'What the AI did: create_expense, query_expenses, forecast_spending, help';
