import { createErrorResponse, createSuccessResponse } from '@plim/shared'
import type { AvatarUploadResponse, Profile } from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { profileService } from './profile.service'

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { api } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'

function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    user_id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    avatar_url: null,
    currency: 'BRL',
    locale: 'pt-BR',
    is_onboarded: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getProfile', () => {
    it('calls correct endpoint', async () => {
      const mockProfile = createMockProfile()
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockProfile))

      const result = await profileService.getProfile()

      expect(api.get).toHaveBeenCalledWith('/profile')
      expect(result).toEqual({ data: mockProfile })
    })

    it('returns error response when user not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await profileService.getProfile()

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when profile not found', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Profile not found')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await profileService.getProfile()

      expect(result).toEqual(errorResponse)
    })
  })

  describe('updateProfile', () => {
    it('sends correct payload with name update', async () => {
      const updatedProfile = createMockProfile({ name: 'Jane Doe' })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedProfile))

      const result = await profileService.updateProfile({ name: 'Jane Doe' })

      expect(api.patch).toHaveBeenCalledWith('/profile', { name: 'Jane Doe' })
      expect(result).toEqual({ data: updatedProfile })
    })

    it('sends correct payload with avatar_url update', async () => {
      const newAvatarUrl = 'https://example.com/avatar.png'
      const updatedProfile = createMockProfile({ avatar_url: newAvatarUrl })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedProfile))

      const result = await profileService.updateProfile({ avatar_url: newAvatarUrl })

      expect(api.patch).toHaveBeenCalledWith('/profile', { avatar_url: newAvatarUrl })
      expect(result).toEqual({ data: updatedProfile })
    })

    it('sends correct payload with currency update', async () => {
      const updatedProfile = createMockProfile({ currency: 'USD' })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedProfile))

      const result = await profileService.updateProfile({ currency: 'USD' })

      expect(api.patch).toHaveBeenCalledWith('/profile', { currency: 'USD' })
      expect(result).toEqual({ data: updatedProfile })
    })

    it('sends correct payload with locale update', async () => {
      const updatedProfile = createMockProfile({ locale: 'en-US' })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedProfile))

      const result = await profileService.updateProfile({ locale: 'en-US' })

      expect(api.patch).toHaveBeenCalledWith('/profile', { locale: 'en-US' })
      expect(result).toEqual({ data: updatedProfile })
    })

    it('sends correct payload with is_onboarded update', async () => {
      const updatedProfile = createMockProfile({ is_onboarded: true })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedProfile))

      const result = await profileService.updateProfile({ is_onboarded: true })

      expect(api.patch).toHaveBeenCalledWith('/profile', { is_onboarded: true })
      expect(result).toEqual({ data: updatedProfile })
    })

    it('sends correct payload with multiple fields', async () => {
      const updates = { name: 'Jane', currency: 'EUR', locale: 'de-DE' }
      const updatedProfile = createMockProfile(updates)
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(updatedProfile))

      const result = await profileService.updateProfile(updates)

      expect(api.patch).toHaveBeenCalledWith('/profile', updates)
      expect(result).toEqual({ data: updatedProfile })
    })

    it('returns error response on validation failure', async () => {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'Invalid currency')
      vi.mocked(api.patch).mockResolvedValue(errorResponse)

      const result = await profileService.updateProfile({ currency: 'INVALID' })

      expect(result).toEqual(errorResponse)
    })
  })

  describe('markOnboarded', () => {
    it('sends is_onboarded: true to correct endpoint', async () => {
      const onboardedProfile = createMockProfile({ is_onboarded: true })
      vi.mocked(api.patch).mockResolvedValue(createSuccessResponse(onboardedProfile))

      const result = await profileService.markOnboarded()

      expect(api.patch).toHaveBeenCalledWith('/profile', { is_onboarded: true })
      expect(result).toEqual({ data: onboardedProfile })
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.patch).mockResolvedValue(errorResponse)

      const result = await profileService.markOnboarded()

      expect(result).toEqual(errorResponse)
    })
  })

  describe('uploadAvatar', () => {
    const mockFile = new File(['test image content'], 'avatar.png', { type: 'image/png' })
    const mockToken = 'test-access-token'

    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: mockToken } },
        error: null,
      } as never)
    })

    it('uploads file with correct FormData and headers', async () => {
      const uploadResponse: AvatarUploadResponse = {
        avatar_url: 'https://storage.example.com/avatars/user-123.png',
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: uploadResponse }),
      })

      const result = await profileService.uploadAvatar(mockFile)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/profile/avatar'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      )
      expect(result).toEqual({ data: uploadResponse })
    })

    it('sends file as FormData with avatar field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { avatar_url: 'https://example.com/avatar.png' } }),
      })

      await profileService.uploadAvatar(mockFile)

      const callArgs = mockFetch.mock.calls[0]
      const body = callArgs?.[1]?.body as FormData
      expect(body).toBeInstanceOf(FormData)
      expect(body.get('avatar')).toBeInstanceOf(File)
      expect((body.get('avatar') as File).name).toBe('avatar.png')
    })

    it('returns UNAUTHORIZED error when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never)

      const result = await profileService.uploadAvatar(mockFile)

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result).toEqual({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      })
    })

    it('returns error response when upload fails with error body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: { code: 'INVALID_FILE_TYPE', message: 'Only images are allowed' },
          }),
      })

      const result = await profileService.uploadAvatar(mockFile)

      expect(result).toEqual({
        error: { code: 'INVALID_FILE_TYPE', message: 'Only images are allowed' },
      })
    })

    it('returns generic error when upload fails without body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('No body')),
      })

      const result = await profileService.uploadAvatar(mockFile)

      expect(result).toEqual({
        error: { code: 'UPLOAD_FAILED', message: 'Upload failed with status 500' },
      })
    })

    it('handles file size exceeded error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 413,
        json: () =>
          Promise.resolve({
            error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 5MB limit' },
          }),
      })

      const result = await profileService.uploadAvatar(mockFile)

      expect(result).toEqual({
        error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 5MB limit' },
      })
    })
  })

  describe('deleteAvatar', () => {
    it('calls correct endpoint', async () => {
      vi.mocked(api.delete).mockResolvedValue(
        createSuccessResponse(undefined as unknown as undefined)
      )

      const result = await profileService.deleteAvatar()

      expect(api.delete).toHaveBeenCalledWith('/profile/avatar')
      expect(result).toEqual({ data: undefined })
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.delete).mockResolvedValue(errorResponse)

      const result = await profileService.deleteAvatar()

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when no avatar to delete', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'No avatar to delete')
      vi.mocked(api.delete).mockResolvedValue(errorResponse)

      const result = await profileService.deleteAvatar()

      expect(result).toEqual(errorResponse)
    })
  })
})
