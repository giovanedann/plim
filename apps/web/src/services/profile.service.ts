import { api } from '@/lib/api-client'
import type { Profile } from '@plim/shared'

export const profileService = {
  async getProfile() {
    return api.get<Profile>('/profile')
  },

  async updateProfile(
    data: Partial<Pick<Profile, 'name' | 'avatar_url' | 'currency' | 'locale' | 'is_onboarded'>>
  ) {
    return api.patch<Profile>('/profile', data)
  },

  async markOnboarded() {
    return api.patch<Profile>('/profile', { is_onboarded: true })
  },
}
