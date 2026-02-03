import {
  type AvatarUploadResponse,
  ERROR_CODES,
  HTTP_STATUS,
  type Profile,
  createMockProfile,
  resetIdCounter,
} from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { ProfileDependencies } from './profile.factory'
import { createProfileRouterWithDeps } from './profile.routes'

// Mock use cases
const mockGetProfile = { execute: vi.fn() }
const mockUpdateProfile = { execute: vi.fn() }
const mockUploadAvatar = { execute: vi.fn() }
const mockDeleteAvatar = { execute: vi.fn() }

const mockDependencies = {
  repository: {},
  getProfile: mockGetProfile,
  updateProfile: mockUpdateProfile,
  uploadAvatar: mockUploadAvatar,
  deleteAvatar: mockDeleteAvatar,
} as unknown as ProfileDependencies

describe('Profile Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createProfileRouterWithDeps(mockDependencies)
    app.route('/profile', router)
  })

  describe('GET /profile', () => {
    it('returns user profile', async () => {
      const profile = createMockProfile({ name: 'John Doe', email: 'user@example.com' })
      mockGetProfile.execute.mockResolvedValue(profile)

      const res = await app.request('/profile')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: Profile }
      expect(body.data).toEqual(profile)
      expect(mockGetProfile.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('returns profile with avatar URL', async () => {
      const profileWithAvatar = createMockProfile({
        avatar_url: 'https://storage.example.com/avatars/user-123.jpg',
      })
      mockGetProfile.execute.mockResolvedValue(profileWithAvatar)

      const res = await app.request('/profile')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: Profile }
      expect(body.data.avatar_url).toBe('https://storage.example.com/avatars/user-123.jpg')
    })

    it('handles profile not found', async () => {
      mockGetProfile.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/profile')

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })
  })

  describe('PATCH /profile', () => {
    it('updates profile with valid input', async () => {
      const updatedProfile = createMockProfile({ name: 'Jane Smith' })
      mockUpdateProfile.execute.mockResolvedValue(updatedProfile)

      const res = await app.request('/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Smith',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: Profile }
      expect(body.data.name).toBe('Jane Smith')
      expect(mockUpdateProfile.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({ name: 'Jane Smith' })
      )
    })

    it('updates multiple fields', async () => {
      const updatedProfile = createMockProfile({ name: 'Jane Smith', currency: 'USD' })
      mockUpdateProfile.execute.mockResolvedValue(updatedProfile)

      const res = await app.request('/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Smith',
          currency: 'USD',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: Profile }
      expect(body.data.name).toBe('Jane Smith')
      expect(body.data.currency).toBe('USD')
    })

    it('allows empty update', async () => {
      const profile = createMockProfile()
      mockUpdateProfile.execute.mockResolvedValue(profile)

      const res = await app.request('/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
    })
  })

  describe('POST /profile/avatar', () => {
    it('uploads avatar successfully', async () => {
      const mockResponse: AvatarUploadResponse = {
        avatar_url: 'https://storage.example.com/avatars/user-123.jpg',
      }
      mockUploadAvatar.execute.mockResolvedValue(mockResponse)

      const formData = new FormData()
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      formData.append('avatar', file)

      const res = await app.request('/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: AvatarUploadResponse }
      expect(body.data.avatar_url).toBe('https://storage.example.com/avatars/user-123.jpg')
      expect(mockUploadAvatar.execute).toHaveBeenCalledWith(TEST_USER_ID, expect.any(File))
    })

    it('returns 400 when file is missing', async () => {
      const formData = new FormData()

      const res = await app.request('/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('handles file validation errors', async () => {
      mockUploadAvatar.execute.mockRejectedValue(
        new AppError(ERROR_CODES.INVALID_INPUT, 'File too large', HTTP_STATUS.BAD_REQUEST)
      )

      const formData = new FormData()
      const file = new File(['large-file'], 'large.jpg', { type: 'image/jpeg' })
      formData.append('avatar', file)

      const res = await app.request('/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('handles storage errors', async () => {
      mockUploadAvatar.execute.mockRejectedValue(
        new AppError(ERROR_CODES.INTERNAL_ERROR, 'Storage error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      )

      const formData = new FormData()
      const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      formData.append('avatar', file)

      const res = await app.request('/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })

  describe('DELETE /profile/avatar', () => {
    it('deletes avatar successfully', async () => {
      mockDeleteAvatar.execute.mockResolvedValue(undefined)

      const res = await app.request('/profile/avatar', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockDeleteAvatar.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('handles missing avatar', async () => {
      mockDeleteAvatar.execute.mockRejectedValue(
        new AppError(ERROR_CODES.NOT_FOUND, 'No avatar to delete', HTTP_STATUS.NOT_FOUND)
      )

      const res = await app.request('/profile/avatar', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('handles storage errors', async () => {
      mockDeleteAvatar.execute.mockRejectedValue(
        new AppError(ERROR_CODES.INTERNAL_ERROR, 'Storage error', HTTP_STATUS.INTERNAL_SERVER_ERROR)
      )

      const res = await app.request('/profile/avatar', {
        method: 'DELETE',
      })

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })
})
