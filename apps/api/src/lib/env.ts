import { type SupabaseClient, createClient } from '@supabase/supabase-js'

export type Bindings = {
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_ACCOUNT_DELETE_SECRET_KEY: string
  AVATARS_BUCKET: R2Bucket
  R2_PUBLIC_URL: string
  ENVIRONMENT: 'development' | 'production'
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  GEMINI_API_KEY: string
  MERCADO_PAGO_ACCESS_TOKEN: string
  MERCADO_PAGO_WEBHOOK_SECRET: string
  API_BASE_URL: string
}

/**
 * Creates a Supabase client using the user's JWT token.
 * This client respects RLS policies for the authenticated user.
 */
export function createSupabaseClientWithAuth(env: Bindings, accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

/**
 * Creates a Supabase client with admin privileges for account deletion.
 * This client bypasses RLS - use only for account deletion operations.
 */
export function createSupabaseAdminClient(env: Bindings): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ACCOUNT_DELETE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
