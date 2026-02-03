import type { UpdateProfile } from '@plim/shared'
import { createMockProfile } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UpdateProfileUseCase } from '../update-profile.usecase'
import { updateProfileController } from './update-profile.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('updateProfileController', () => {
  let sut: typeof updateProfileController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = updateProfileController
    mockUseCase = createMockUseCase()
  })

  it('updates profile with valid input', async () => {
    const input: UpdateProfile = {
      name: 'Jane Smith',
    }
    const profile = createMockProfile({
      user_id: userId,
      name: 'Jane Smith',
    })
    mockUseCase.execute.mockResolvedValue(profile)

    const result = await sut(userId, input, mockUseCase as unknown as UpdateProfileUseCase)

    expect(result).toEqual(profile)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, input)
  })

  it('passes through use case errors', async () => {
    const input: UpdateProfile = {
      name: 'Jane Smith',
    }
    const error = new Error('Update failed')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(
      sut(userId, input, mockUseCase as unknown as UpdateProfileUseCase)
    ).rejects.toThrow('Update failed')
  })
})
