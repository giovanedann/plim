import { ERROR_CODES, HTTP_STATUS, type Profile, type UpdateProfile } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ProfileRepository } from './profile.repository'
import { UpdateProfileUseCase } from './update-profile.usecase'

const mockProfile: Profile = {
  user_id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  avatar_url: null,
  currency: 'BRL',
  locale: 'pt-BR',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase
  let mockRepository: { update: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = {
      update: vi.fn(),
    }
    useCase = new UpdateProfileUseCase(mockRepository as unknown as ProfileRepository)
  })

  it('updates and returns profile when found', async () => {
    const updateInput: UpdateProfile = { name: 'Jane Doe' }
    const updatedProfile = { ...mockProfile, name: 'Jane Doe' }
    mockRepository.update.mockResolvedValue(updatedProfile)

    const result = await useCase.execute('user-123', updateInput)

    expect(result).toEqual(updatedProfile)
    expect(mockRepository.update).toHaveBeenCalledWith('user-123', updateInput)
  })

  it('throws NOT_FOUND error when profile does not exist', async () => {
    mockRepository.update.mockResolvedValue(null)

    await expect(useCase.execute('user-123', { name: 'Jane' })).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123', { name: 'Jane' })).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('allows partial updates', async () => {
    const updateInput: UpdateProfile = { currency: 'USD' }
    const updatedProfile = { ...mockProfile, currency: 'USD' }
    mockRepository.update.mockResolvedValue(updatedProfile)

    const result = await useCase.execute('user-123', updateInput)

    expect(result.currency).toBe('USD')
    expect(result.name).toBe(mockProfile.name)
  })
})
