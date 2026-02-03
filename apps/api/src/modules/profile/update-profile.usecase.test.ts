import { ERROR_CODES, HTTP_STATUS, type UpdateProfile, createMockProfile } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ProfileRepository } from './profile.repository'
import { UpdateProfileUseCase } from './update-profile.usecase'

type MockRepository = {
  update: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    update: vi.fn(),
  }
}

describe('UpdateProfileUseCase', () => {
  let sut: UpdateProfileUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new UpdateProfileUseCase(mockRepository as unknown as ProfileRepository)
  })

  it('updates and returns profile when found', async () => {
    const existingProfile = createMockProfile({ user_id: 'user-123' })
    const updateInput: UpdateProfile = { name: 'Jane Doe' }
    const updatedProfile = { ...existingProfile, name: 'Jane Doe' }
    mockRepository.update.mockResolvedValue(updatedProfile)

    const result = await sut.execute('user-123', updateInput)

    expect(result.name).toBe('Jane Doe')
  })

  it('throws NOT_FOUND error when profile does not exist', async () => {
    mockRepository.update.mockResolvedValue(null)

    await expect(sut.execute('user-123', { name: 'Jane' })).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', { name: 'Jane' })).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('allows partial updates', async () => {
    const existingProfile = createMockProfile({ user_id: 'user-123' })
    const updateInput: UpdateProfile = { currency: 'USD' }
    const updatedProfile = { ...existingProfile, currency: 'USD' }
    mockRepository.update.mockResolvedValue(updatedProfile)

    const result = await sut.execute('user-123', updateInput)

    expect(result.currency).toBe('USD')
    expect(result.name).toBe('Test User')
  })

  it('updates multiple fields at once', async () => {
    const existingProfile = createMockProfile({ user_id: 'user-123' })
    const updateInput: UpdateProfile = {
      name: 'Jane Doe',
      currency: 'EUR',
      locale: 'en-US',
    }
    const updatedProfile = { ...existingProfile, ...updateInput }
    mockRepository.update.mockResolvedValue(updatedProfile)

    const result = await sut.execute('user-123', updateInput)

    expect(result.name).toBe('Jane Doe')
    expect(result.currency).toBe('EUR')
    expect(result.locale).toBe('en-US')
  })

  describe('boundary and edge cases', () => {
    it('handles empty name', async () => {
      const existingProfile = createMockProfile({ user_id: 'user-123' })
      const updateInput: UpdateProfile = { name: '' }
      const updatedProfile = { ...existingProfile, name: '' }
      mockRepository.update.mockResolvedValue(updatedProfile)

      const result = await sut.execute('user-123', updateInput)

      expect(result.name).toBe('')
    })

    it('handles very long name', async () => {
      const existingProfile = createMockProfile({ user_id: 'user-123' })
      const longName = 'A'.repeat(255)
      const updateInput: UpdateProfile = { name: longName }
      const updatedProfile = { ...existingProfile, name: longName }
      mockRepository.update.mockResolvedValue(updatedProfile)

      const result = await sut.execute('user-123', updateInput)

      expect(result.name).toBe(longName)
      expect(result.name).toHaveLength(255)
    })

    it('handles special characters in name', async () => {
      const existingProfile = createMockProfile({ user_id: 'user-123' })
      const updateInput: UpdateProfile = { name: 'José María Ñoño' }
      const updatedProfile = { ...existingProfile, name: 'José María Ñoño' }
      mockRepository.update.mockResolvedValue(updatedProfile)

      const result = await sut.execute('user-123', updateInput)

      expect(result.name).toBe('José María Ñoño')
    })

    it('handles all supported currencies', async () => {
      const existingProfile = createMockProfile({ user_id: 'user-123' })
      const currencies = ['BRL', 'USD', 'EUR', 'GBP'] as const

      for (const currency of currencies) {
        const updateInput: UpdateProfile = { currency }
        const updatedProfile = { ...existingProfile, currency }
        mockRepository.update.mockResolvedValue(updatedProfile)

        const result = await sut.execute('user-123', updateInput)

        expect(result.currency).toBe(currency)
      }
    })

    it('handles all supported locales', async () => {
      const existingProfile = createMockProfile({ user_id: 'user-123' })
      const locales = ['pt-BR', 'en-US', 'es-ES'] as const

      for (const locale of locales) {
        const updateInput: UpdateProfile = { locale }
        const updatedProfile = { ...existingProfile, locale }
        mockRepository.update.mockResolvedValue(updatedProfile)

        const result = await sut.execute('user-123', updateInput)

        expect(result.locale).toBe(locale)
      }
    })

    it('handles setting avatar URL', async () => {
      const existingProfile = createMockProfile({ user_id: 'user-123', avatar_url: null })
      const updateInput: UpdateProfile = { avatar_url: 'https://example.com/avatar.jpg' }
      const updatedProfile = { ...existingProfile, avatar_url: 'https://example.com/avatar.jpg' }
      mockRepository.update.mockResolvedValue(updatedProfile)

      const result = await sut.execute('user-123', updateInput)

      expect(result.avatar_url).toBe('https://example.com/avatar.jpg')
    })

    it('handles removing avatar URL', async () => {
      const existingProfile = createMockProfile({
        user_id: 'user-123',
        avatar_url: 'https://example.com/avatar.jpg',
      })
      const updateInput: UpdateProfile = { avatar_url: null }
      const updatedProfile = { ...existingProfile, avatar_url: null }
      mockRepository.update.mockResolvedValue(updatedProfile)

      const result = await sut.execute('user-123', updateInput)

      expect(result.avatar_url).toBeNull()
    })

    it('handles completing onboarding', async () => {
      const existingProfile = createMockProfile({ user_id: 'user-123', is_onboarded: false })
      const updateInput: UpdateProfile = { is_onboarded: true }
      const updatedProfile = { ...existingProfile, is_onboarded: true }
      mockRepository.update.mockResolvedValue(updatedProfile)

      const result = await sut.execute('user-123', updateInput)

      expect(result.is_onboarded).toBe(true)
    })
  })
})
