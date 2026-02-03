import type { AvatarUploadResponse } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UploadAvatarUseCase } from '../upload-avatar.usecase'
import { uploadAvatarController } from './upload-avatar.controller'

type MockUseCase = {
  execute: ReturnType<typeof vi.fn>
}

function createMockUseCase(): MockUseCase {
  return {
    execute: vi.fn(),
  }
}

describe('uploadAvatarController', () => {
  let sut: typeof uploadAvatarController
  let mockUseCase: MockUseCase
  const userId = 'user-123'

  beforeEach(() => {
    sut = uploadAvatarController
    mockUseCase = createMockUseCase()
  })

  it('uploads avatar successfully', async () => {
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    const response: AvatarUploadResponse = {
      avatar_url: 'https://storage.example.com/avatars/user-123.jpg',
    }
    mockUseCase.execute.mockResolvedValue(response)

    const result = await sut(userId, file, mockUseCase as unknown as UploadAvatarUseCase)

    expect(result).toEqual(response)
    expect(mockUseCase.execute).toHaveBeenCalledWith(userId, file)
  })

  it('passes through use case errors', async () => {
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    const error = new Error('Upload failed')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(sut(userId, file, mockUseCase as unknown as UploadAvatarUseCase)).rejects.toThrow(
      'Upload failed'
    )
  })

  it('handles validation errors', async () => {
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    const error = new Error('File too large')
    mockUseCase.execute.mockRejectedValue(error)

    await expect(sut(userId, file, mockUseCase as unknown as UploadAvatarUseCase)).rejects.toThrow(
      'File too large'
    )
  })
})
