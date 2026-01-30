import type { Profile, UpdateProfile } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileRepository } from './profile.repository'

function createMockSupabaseClient() {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockUpdate = vi.fn()
  const mockFrom = vi.fn()

  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  })

  mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
  })

  mockUpdate.mockReturnValue({
    eq: mockEq,
  })

  mockEq.mockReturnValue({
    single: mockSingle,
    select: mockSelect,
  })

  const supabase = {
    from: mockFrom,
  } as unknown as SupabaseClient

  return {
    supabase,
    mockFrom,
    mockSelect,
    mockUpdate,
    mockEq,
    mockSingle,
  }
}

function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    user_id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
    currency: 'BRL',
    locale: 'pt-BR',
    is_onboarded: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('ProfileRepository', () => {
  let sut: ProfileRepository
  let mocks: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mocks = createMockSupabaseClient()
    sut = new ProfileRepository(mocks.supabase)
  })

  describe('findByUserId', () => {
    it('returns profile when user exists', async () => {
      // Arrange
      const userId = 'user-123'
      const expectedProfile = createMockProfile()
      mocks.mockSingle.mockResolvedValue({
        data: expectedProfile,
        error: null,
      })

      // Act
      const result = await sut.findByUserId(userId)

      // Assert
      expect(result).toEqual(expectedProfile)
      expect(mocks.mockFrom).toHaveBeenCalledWith('profile')
      expect(mocks.mockSelect).toHaveBeenCalledWith(
        'user_id, name, email, avatar_url, currency, locale, is_onboarded, created_at, updated_at'
      )
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns null when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent-user'
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      // Act
      const result = await sut.findByUserId(userId)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null when query fails', async () => {
      // Arrange
      const userId = 'user-123'
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      // Act
      const result = await sut.findByUserId(userId)

      // Assert
      expect(result).toBeNull()
    })

    it('returns profile with all fields populated', async () => {
      // Arrange
      const userId = 'user-456'
      const profileWithAllFields = createMockProfile({
        user_id: userId,
        name: 'Full User',
        email: 'full@example.com',
        avatar_url: 'https://example.com/avatar.png',
        currency: 'USD',
        locale: 'en-US',
        is_onboarded: false,
      })
      mocks.mockSingle.mockResolvedValue({
        data: profileWithAllFields,
        error: null,
      })

      // Act
      const result = await sut.findByUserId(userId)

      // Assert
      expect(result).toEqual(profileWithAllFields)
      expect(result?.avatar_url).toBe('https://example.com/avatar.png')
      expect(result?.currency).toBe('USD')
      expect(result?.locale).toBe('en-US')
    })
  })

  describe('update', () => {
    it('updates and returns profile when successful', async () => {
      // Arrange
      const userId = 'user-123'
      const input: UpdateProfile = {
        name: 'Updated Name',
        currency: 'USD',
      }
      const updatedProfile = createMockProfile({
        name: 'Updated Name',
        currency: 'USD',
        updated_at: '2024-01-15T10:00:00Z',
      })
      mocks.mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      })

      // Act
      const result = await sut.update(userId, input)

      // Assert
      expect(result).toEqual(updatedProfile)
      expect(mocks.mockFrom).toHaveBeenCalledWith('profile')
      expect(mocks.mockUpdate).toHaveBeenCalledWith({
        ...input,
        updated_at: expect.any(String),
      })
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns null when update fails', async () => {
      // Arrange
      const userId = 'user-123'
      const input: UpdateProfile = { name: 'Updated Name' }
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      })

      // Act
      const result = await sut.update(userId, input)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null when profile does not exist', async () => {
      // Arrange
      const userId = 'nonexistent-user'
      const input: UpdateProfile = { name: 'Updated Name' }
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      // Act
      const result = await sut.update(userId, input)

      // Assert
      expect(result).toBeNull()
    })

    it('updates only provided fields', async () => {
      // Arrange
      const userId = 'user-123'
      const input: UpdateProfile = { locale: 'es-ES' }
      const updatedProfile = createMockProfile({
        locale: 'es-ES',
        updated_at: '2024-01-15T10:00:00Z',
      })
      mocks.mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      })

      // Act
      const result = await sut.update(userId, input)

      // Assert
      expect(result).toEqual(updatedProfile)
      expect(mocks.mockUpdate).toHaveBeenCalledWith({
        locale: 'es-ES',
        updated_at: expect.any(String),
      })
    })

    it('updates is_onboarded field', async () => {
      // Arrange
      const userId = 'user-123'
      const input: UpdateProfile = { is_onboarded: true }
      const updatedProfile = createMockProfile({
        is_onboarded: true,
        updated_at: '2024-01-15T10:00:00Z',
      })
      mocks.mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      })

      // Act
      const result = await sut.update(userId, input)

      // Assert
      expect(result).toEqual(updatedProfile)
      expect(result?.is_onboarded).toBe(true)
    })

    it('updates avatar_url field', async () => {
      // Arrange
      const userId = 'user-123'
      const input: UpdateProfile = { avatar_url: 'https://example.com/new-avatar.png' }
      const updatedProfile = createMockProfile({
        avatar_url: 'https://example.com/new-avatar.png',
        updated_at: '2024-01-15T10:00:00Z',
      })
      mocks.mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      })

      // Act
      const result = await sut.update(userId, input)

      // Assert
      expect(result).toEqual(updatedProfile)
      expect(result?.avatar_url).toBe('https://example.com/new-avatar.png')
    })

    it('clears avatar_url when set to null', async () => {
      // Arrange
      const userId = 'user-123'
      const input: UpdateProfile = { avatar_url: null }
      const updatedProfile = createMockProfile({
        avatar_url: null,
        updated_at: '2024-01-15T10:00:00Z',
      })
      mocks.mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      })

      // Act
      const result = await sut.update(userId, input)

      // Assert
      expect(result).toEqual(updatedProfile)
      expect(result?.avatar_url).toBeNull()
    })
  })
})
