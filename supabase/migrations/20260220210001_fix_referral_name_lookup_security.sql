-- Drop the overly permissive policy (exposes all profile columns)
DROP POLICY IF EXISTS "Users can view names of their referrals" ON public.profile;

-- Use a SECURITY DEFINER function that only returns names
CREATE OR REPLACE FUNCTION public.get_referred_user_names(p_referred_user_ids uuid[])
RETURNS TABLE(user_id uuid, name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return names for users that the caller actually referred
  RETURN QUERY
  SELECT p.user_id, p.name
  FROM public.profile p
  INNER JOIN public.referral r ON r.referred_user_id = p.user_id
  WHERE r.referrer_user_id = auth.uid()
    AND p.user_id = ANY(p_referred_user_ids);
END;
$$;

-- Only authenticated users can call this
REVOKE ALL ON FUNCTION public.get_referred_user_names(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referred_user_names(uuid[]) TO authenticated;
