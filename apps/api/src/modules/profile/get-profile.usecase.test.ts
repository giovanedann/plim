import { ERROR_CODES, HTTP_STATUS, createMockProfile } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { GetProfileUseCase } from './get-profile.usecase'
import type { ProfileRepository } from './profile.repository'

type MockRepository = Pick<ProfileRepository, 'findByUserId'>

function createMockRepository(): MockRepository {
  return {
    findByUserId: vi.fn(),
  }
}

describe('GetProfileUseCase', () => {
  let sut: GetProfileUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new GetProfileUseCase(mockRepository as ProfileRepository)
  })

  it('returns profile when found', async () => {
    const profile = createMockProfile({ user_id: 'user-123' })
    mockRepository.findByUserId = vi.fn().mockResolvedValue(profile)

    const result = await sut.execute('user-123')

    expect(result).toEqual(profile)
  })

  it('throws NOT_FOUND error when profile does not exist', async () => {
    mockRepository.findByUserId = vi.fn().mockResolvedValue(null)

    await expect(sut.execute('user-123')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })
})
