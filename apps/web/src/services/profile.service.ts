import { api } from '@/lib/api-client'
import type { Profile } from '@/lib/api-types'

export const profileService = {
  async getProfile() {
    return api.get<Profile>('/profile')
  },

  async updateProfile(
    data: Partial<Pick<Profile, 'display_name' | 'currency' | 'locale' | 'onboarded'>>
  ) {
    return api.patch<Profile>('/profile', data)
  },

  async markOnboarded() {
    return api.patch<Profile>('/profile', { onboarded: true })
  },
}
