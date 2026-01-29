-- Data Export Log Table for LGPD Compliance
-- Tracks when users export their data (rate limited to 1 per table per week)

CREATE TABLE IF NOT EXISTS data_export_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  exported_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, table_name)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_data_export_log_user_id ON data_export_log(user_id);

-- Enable RLS
ALTER TABLE data_export_log ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own export logs
CREATE POLICY "Users can view own export logs"
  ON data_export_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own export logs"
  ON data_export_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own export logs"
  ON data_export_log FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
