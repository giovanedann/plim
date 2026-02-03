import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeleteAvatarUseCase } from '../delete-avatar.usecase'
import { deleteAvatarController } from './delete-avatar.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('deleteAvatarController', () => {
  let sut: typeof deleteAvatarController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = deleteAvatarController
    mockUseCase = createMockUseCase()
  })

  it('deletes avatar successfully', async () => {
    mockUseCase.execute.mockResolvedValue(undefined)

    const result = await sut(userId, mockUseCase as unknown as DeleteAvatarUseCase)

    expect(result).toBeUndefined()
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId)
  })

  it('passes through use case errors', async () => {
    const error = new Error('Storage error')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(sut(userId, mockUseCase as unknown as DeleteAvatarUseCase)).rejects.toThrow(
      'Storage error'
    )
  })
})
