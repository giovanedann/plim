-- Add is_onboarded column to profile table
ALTER TABLE public.profile
ADD COLUMN is_onboarded BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profile.is_onboarded IS 'Whether user has completed the onboarding flow';
