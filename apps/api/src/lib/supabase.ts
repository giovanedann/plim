import { type SupabaseClient, createClient } from '@supabase/supabase-js'

export type Bindings = {
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
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
