-- Optimize RLS policies to use (select auth.uid()) instead of auth.uid()
-- This prevents the auth function from being re-evaluated for each row,
-- improving query performance at scale.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- private.credit_card_data policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their own credit cards" ON private.credit_card_data;
DROP POLICY IF EXISTS "Users can insert their own credit cards" ON private.credit_card_data;
DROP POLICY IF EXISTS "Users can update their own credit cards" ON private.credit_card_data;
DROP POLICY IF EXISTS "Users can view their own credit cards" ON private.credit_card_data;

-- Recreate policies with optimized auth.uid() calls
CREATE POLICY "Users can delete their own credit cards" ON private.credit_card_data
    FOR DELETE
    USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own credit cards" ON private.credit_card_data
    FOR INSERT
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own credit cards" ON private.credit_card_data
    FOR UPDATE
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view their own credit cards" ON private.credit_card_data
    FOR SELECT
    USING (user_id = (select auth.uid()));

-- ============================================
-- public.spending_limit policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own spending limits" ON public.spending_limit;
DROP POLICY IF EXISTS "Users can delete their own spending limits" ON public.spending_limit;
DROP POLICY IF EXISTS "Users can update their own spending limits" ON public.spending_limit;
DROP POLICY IF EXISTS "Users can view their own spending limits" ON public.spending_limit;

-- Recreate policies with optimized auth.uid() calls
CREATE POLICY "Users can create their own spending limits" ON public.spending_limit
    FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own spending limits" ON public.spending_limit
    FOR DELETE
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own spending limits" ON public.spending_limit
    FOR UPDATE
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own spending limits" ON public.spending_limit
    FOR SELECT
    USING ((select auth.uid()) = user_id);
