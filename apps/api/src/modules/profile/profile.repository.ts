import type { Profile, UpdateProfile } from '@myfinances/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

export class ProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profile')
      .select(
        'user_id, name, email, avatar_url, currency, locale, is_onboarded, created_at, updated_at'
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
        'user_id, name, email, avatar_url, currency, locale, is_onboarded, created_at, updated_at'
      )
      .single()

    if (error || !data) return null

    return data as Profile
  }
}
