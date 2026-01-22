-- Migration 1: Setup encryption infrastructure
-- Creates encryption key in Vault and helper function to retrieve it

-- Create private schema for internal functions and encrypted tables
CREATE SCHEMA IF NOT EXISTS private;

-- Revoke public access to private schema
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres;
GRANT USAGE ON SCHEMA private TO service_role;

-- Create the encryption key in Vault
-- Using a cryptographically secure random 32-byte key encoded as base64
SELECT vault.create_secret(
  encode(gen_random_bytes(32), 'base64'),
  'plim_encryption_key',
  'Symmetric encryption key for sensitive financial data (amount_cents in expense and salary_history tables)'
);

-- Create helper function to retrieve the encryption key
-- SECURITY DEFINER allows the function to access Vault even when called by authenticated users
CREATE OR REPLACE FUNCTION private.get_encryption_key()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'plim_encryption_key'
  LIMIT 1;
$$;

-- Restrict access to the helper function
REVOKE ALL ON FUNCTION private.get_encryption_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_encryption_key() TO postgres;
GRANT EXECUTE ON FUNCTION private.get_encryption_key() TO service_role;
GRANT EXECUTE ON FUNCTION private.get_encryption_key() TO authenticated;

COMMENT ON FUNCTION private.get_encryption_key() IS 'Retrieves the encryption key from Vault for pgcrypto operations. Used internally by encryption triggers.';
