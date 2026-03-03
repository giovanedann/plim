-- Downgrade expired referral/gifted pro subscriptions
--
-- Users who received pro via referral have tier='pro' and current_period_end set,
-- but mp_payment_status is NULL (they never paid). When the period expires,
-- their tier must be reset to 'free'.
--
-- This cron job runs hourly and updates any expired non-paying pro subscriptions.
--
-- SCALABILITY NOTE:
-- This approach (hourly table scan + batch UPDATE) is efficient up to ~100K MAU.
-- The WHERE clause hits only expired rows, so the actual write set is tiny.
-- Beyond 100K MAU, consider switching to an event-driven model where payment
-- provider webhooks (or a task queue) trigger individual downgrades immediately,
-- eliminating the need for periodic scanning entirely.

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Add index to speed up the expiration scan
CREATE INDEX IF NOT EXISTS idx_subscription_expiration
  ON public.subscription (current_period_end)
  WHERE tier != 'free' AND mp_payment_status IS DISTINCT FROM 'approved';

-- Schedule hourly downgrade of expired non-paying pro subscriptions
SELECT cron.schedule(
  'downgrade-expired-subscriptions',
  '0 * * * *',
  $$
    UPDATE public.subscription
    SET tier = 'free',
        updated_at = now()
    WHERE tier != 'free'
      AND current_period_end < now()
      AND mp_payment_status IS DISTINCT FROM 'approved';
  $$
);

-- Verification queries:
-- SELECT * FROM cron.job WHERE jobname = 'downgrade-expired-subscriptions';
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'downgrade-expired-subscriptions') ORDER BY start_time DESC LIMIT 5;
