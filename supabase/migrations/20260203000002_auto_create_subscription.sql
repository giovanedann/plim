-- Migration: Auto-create subscription on user signup
-- Description: Trigger to automatically create a free subscription when a user registers

-- Function to create default subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.subscription (user_id, tier, ai_requests_limit)
  VALUES (NEW.id, 'free', 30);
  RETURN NEW;
END;
$$;

-- Trigger on auth.users to create subscription on signup
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Backfill: Create subscriptions for existing users who don't have one
INSERT INTO public.subscription (user_id, tier, ai_requests_limit)
SELECT id, 'free', 30
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.subscription);
