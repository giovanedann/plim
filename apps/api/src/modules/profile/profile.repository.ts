import type { Profile, UpdateProfile } from '@plim/shared'
import type { Database } from '@plim/shared/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export class ProfileRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profile')
      .select(
        'user_id, name, email, avatar_url, currency, locale, is_onboarded, referred_by, created_at, updated_at'
      )
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    return data as Profile
  }

  async update(userId: string, input: UpdateProfile): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profile')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select(
        'user_id, name, email, avatar_url, currency, locale, is_onboarded, referred_by, created_at, updated_at'
      )
      .single()

    if (error || !data) return null

    return data as Profile
  }
}
