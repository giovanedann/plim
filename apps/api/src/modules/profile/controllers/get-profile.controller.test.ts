import { createMockProfile } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GetProfileUseCase } from '../get-profile.usecase'
import { getProfileController } from './get-profile.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('getProfileController', () => {
  let sut: typeof getProfileController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = getProfileController
    mockUseCase = createMockUseCase()
  })

  it('returns profile for user', async () => {
    const profile = createMockProfile({
      user_id: userId,
      email: 'user@example.com',
      name: 'John Doe',
    })
    mockUseCase.execute.mockResolvedValue(profile)

    const result = await sut(userId, mockUseCase as unknown as GetProfileUseCase)

    expect(result).toEqual(profile)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId)
  })

  it('passes through use case errors', async () => {
    const error = new Error('Profile not found')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(sut(userId, mockUseCase as unknown as GetProfileUseCase)).rejects.toThrow(
      'Profile not found'
    )
  })
})
