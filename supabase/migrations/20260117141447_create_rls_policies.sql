-- Profile policies
CREATE POLICY "Users can view their own profile"
  ON public.profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profile FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Category policies
CREATE POLICY "Users can view system defaults and their own categories"
  ON public.category FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON public.category FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.category FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.category FOR DELETE
  USING (auth.uid() = user_id);

-- Expense policies
CREATE POLICY "Users can view their own expenses"
  ON public.expense FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
  ON public.expense FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expense FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expense FOR DELETE
  USING (auth.uid() = user_id);

-- Salary history policies
CREATE POLICY "Users can view their own salary history"
  ON public.salary_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own salary records"
  ON public.salary_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salary records"
  ON public.salary_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salary records"
  ON public.salary_history FOR DELETE
  USING (auth.uid() = user_id);
