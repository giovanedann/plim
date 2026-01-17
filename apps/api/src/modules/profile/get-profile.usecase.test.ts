import { ERROR_CODES, HTTP_STATUS, type Profile } from '@myfinances/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { GetProfileUseCase } from './get-profile.usecase'
import type { ProfileRepository } from './profile.repository'

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

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase
  let mockRepository: { findByUserId: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
    }
    useCase = new GetProfileUseCase(mockRepository as unknown as ProfileRepository)
  })

  it('returns profile when found', async () => {
    mockRepository.findByUserId.mockResolvedValue(mockProfile)

    const result = await useCase.execute('user-123')

    expect(result).toEqual(mockProfile)
    expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123')
  })

  it('throws NOT_FOUND error when profile does not exist', async () => {
    mockRepository.findByUserId.mockResolvedValue(null)

    await expect(useCase.execute('user-123')).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })
})
