ALTER TABLE public.profile
  ADD COLUMN referred_by TEXT
  CONSTRAINT profile_referred_by_max_length CHECK (char_length(referred_by) <= 100);
