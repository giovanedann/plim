import { type ApiResponse, api } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'
import type { AvatarUploadResponse, Profile } from '@plim/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export const profileService = {
  async getProfile(): Promise<ApiResponse<Profile>> {
    return api.get<Profile>('/profile')
  },

  async updateProfile(
    data: Partial<Pick<Profile, 'name' | 'avatar_url' | 'currency' | 'locale' | 'is_onboarded'>>
  ): Promise<ApiResponse<Profile>> {
    return api.patch<Profile>('/profile', data)
  },

  async markOnboarded(): Promise<ApiResponse<Profile>> {
    return api.patch<Profile>('/profile', { is_onboarded: true })
  },

  async uploadAvatar(file: File): Promise<ApiResponse<AvatarUploadResponse>> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }
    }

    const formData = new FormData()
    formData.append('avatar', file)

    const response = await fetch(`${API_URL}/api/v1/profile/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        error: errorData.error || {
          code: 'UPLOAD_FAILED',
          message: `Upload failed with status ${response.status}`,
        },
      }
    }

    const json = await response.json()
    return { data: json.data }
  },

  async deleteAvatar(): Promise<ApiResponse<void>> {
    return api.delete<void>('/profile/avatar')
  },
}
