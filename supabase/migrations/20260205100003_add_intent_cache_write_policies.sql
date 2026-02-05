-- Allow authenticated users to insert into intent_cache (global cache)
CREATE POLICY "Authenticated users can insert intent cache"
  ON public.intent_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update intent_cache (for usage_count increment)
CREATE POLICY "Authenticated users can update intent cache"
  ON public.intent_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
