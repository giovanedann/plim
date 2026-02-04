-- Create a read-only SQL execution function for AI queries
-- This function executes SELECT queries only and returns JSON results

CREATE OR REPLACE FUNCTION execute_readonly_sql(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result JSONB;
  normalized_query TEXT;
BEGIN
  -- Normalize query for validation
  normalized_query := UPPER(TRIM(query_text));

  -- Validate that query starts with SELECT or WITH (CTE)
  IF NOT (normalized_query LIKE 'SELECT%' OR normalized_query LIKE 'WITH%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Block dangerous keywords
  IF normalized_query ~ '\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Dangerous SQL operation detected';
  END IF;

  -- Execute the query and return results as JSON
  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || query_text || ') t'
  INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users only
REVOKE ALL ON FUNCTION execute_readonly_sql(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION execute_readonly_sql(TEXT) TO authenticated;

COMMENT ON FUNCTION execute_readonly_sql IS 'Executes read-only SQL queries for AI assistant. Only SELECT statements allowed. Bypasses RLS since user_id filtering is enforced in the application layer.';
