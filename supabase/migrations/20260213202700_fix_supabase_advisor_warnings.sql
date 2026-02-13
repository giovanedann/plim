-- 1. SECURITY: Fix function search_path mutable
CREATE OR REPLACE FUNCTION public.update_intent_cache_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. PERFORMANCE: Fix RLS initplan — wrap auth.uid() in (select auth.uid())
-- This prevents re-evaluation per row.

-- data_export_log (3 policies)
DROP POLICY "Users can view own export logs" ON public.data_export_log;
CREATE POLICY "Users can view own export logs" ON public.data_export_log
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY "Users can insert own export logs" ON public.data_export_log;
CREATE POLICY "Users can insert own export logs" ON public.data_export_log
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update own export logs" ON public.data_export_log;
CREATE POLICY "Users can update own export logs" ON public.data_export_log
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ai_usage (2 policies)
DROP POLICY "Users can read own ai_usage" ON public.ai_usage;
CREATE POLICY "Users can read own ai_usage" ON public.ai_usage
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY "Users can insert own ai_usage" ON public.ai_usage;
CREATE POLICY "Users can insert own ai_usage" ON public.ai_usage
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- subscription (2 policies)
DROP POLICY "Users can read own subscription" ON public.subscription;
CREATE POLICY "Users can read own subscription" ON public.subscription
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY "Users can update own subscription" ON public.subscription;
CREATE POLICY "Users can update own subscription" ON public.subscription
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ai_response_cache (3 policies — originally granted to public role)
DROP POLICY "Users can read own cache" ON public.ai_response_cache;
CREATE POLICY "Users can read own cache" ON public.ai_response_cache
  FOR SELECT TO public USING ((select auth.uid()) = user_id);

DROP POLICY "Users can insert own cache" ON public.ai_response_cache;
CREATE POLICY "Users can insert own cache" ON public.ai_response_cache
  FOR INSERT TO public WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can delete own cache" ON public.ai_response_cache;
CREATE POLICY "Users can delete own cache" ON public.ai_response_cache
  FOR DELETE TO public USING ((select auth.uid()) = user_id);

-- payment_log (1 policy)
DROP POLICY "Users can insert own payment logs" ON public.payment_log;
CREATE POLICY "Users can insert own payment logs" ON public.payment_log
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

-- 3. PERFORMANCE: Drop unused indexes
DROP INDEX IF EXISTS public.intent_cache_function_name_idx;
DROP INDEX IF EXISTS public.intent_cache_usage_count_idx;
DROP INDEX IF EXISTS public.idx_subscription_mp_payment_id;
DROP INDEX IF EXISTS public.idx_subscription_mp_preapproval_id;
DROP INDEX IF EXISTS public.ai_response_cache_expires_idx;
