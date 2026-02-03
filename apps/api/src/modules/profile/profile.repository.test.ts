import type { UpdateProfile } from '@plim/shared'
import { createMockProfile } from '@plim/shared/test-utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfileRepository } from './profile.repository'

type MockSupabaseClient = {
  supabase: SupabaseClient
  mockFrom: ReturnType<typeof vi.fn>
  mockSelect: ReturnType<typeof vi.fn>
  mockUpdate: ReturnType<typeof vi.fn>
  mockEq: ReturnType<typeof vi.fn>
  mockSingle: ReturnType<typeof vi.fn>
}

function createMockSupabaseClient(): MockSupabaseClient {
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

describe('ProfileRepository', () => {
  let sut: ProfileRepository
  let mocks: MockSupabaseClient

  beforeEach(() => {
    mocks = createMockSupabaseClient()
    sut = new ProfileRepository(mocks.supabase)
  })

  describe('findByUserId', () => {
    it('returns profile when user exists', async () => {
      const userId = 'user-123'
      const expectedProfile = createMockProfile({ user_id: userId })
      mocks.mockSingle.mockResolvedValue({
        data: expectedProfile,
        error: null,
      })

      const result = await sut.findByUserId(userId)

      expect(result).toEqual(expectedProfile)
    })

    it('returns null when user does not exist', async () => {
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await sut.findByUserId('nonexistent-user')

      expect(result).toBeNull()
    })

    it('returns null when query fails', async () => {
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      const result = await sut.findByUserId('user-123')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('updates and returns profile when successful', async () => {
      const userId = 'user-123'
      const input: UpdateProfile = {
        name: 'Updated Name',
        currency: 'USD',
      }
      const updatedProfile = createMockProfile({
        user_id: userId,
        name: 'Updated Name',
        currency: 'USD',
      })
      mocks.mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      })

      const result = await sut.update(userId, input)

      expect(result).toEqual(updatedProfile)
    })

    it('returns null when update fails', async () => {
      const input: UpdateProfile = { name: 'Updated Name' }
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      })

      const result = await sut.update('user-123', input)

      expect(result).toBeNull()
    })

    it('returns null when profile does not exist', async () => {
      const input: UpdateProfile = { name: 'Updated Name' }
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await sut.update('nonexistent-user', input)

      expect(result).toBeNull()
    })

    it('clears avatar_url when set to null', async () => {
      const userId = 'user-123'
      const input: UpdateProfile = { avatar_url: null }
      const updatedProfile = createMockProfile({
        user_id: userId,
        avatar_url: null,
      })
      mocks.mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      })

      const result = await sut.update(userId, input)

      expect(result?.avatar_url).toBeNull()
    })
  })
})
