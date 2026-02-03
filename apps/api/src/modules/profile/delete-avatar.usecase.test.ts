import { ERROR_CODES, HTTP_STATUS, createMockProfile } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { DeleteAvatarUseCase } from './delete-avatar.usecase'
import type { ProfileRepository } from './profile.repository'
import type { AvatarStorage } from './upload-avatar.usecase'

type MockRepository = Pick<ProfileRepository, 'findByUserId' | 'update'>

function createMockRepository(): MockRepository {
  return {
    findByUserId: vi.fn(),
    update: vi.fn(),
  }
}

function createMockStorage(): AvatarStorage {
  return {
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  }
}

describe('DeleteAvatarUseCase', () => {
  let sut: DeleteAvatarUseCase
  let mockRepository: MockRepository
  let mockStorage: AvatarStorage
  const publicUrl = 'https://avatars.example.com'

  beforeEach(() => {
    mockRepository = createMockRepository()
    mockStorage = createMockStorage()
    sut = new DeleteAvatarUseCase(mockRepository as ProfileRepository, mockStorage, publicUrl)
  })

  it('deletes avatar from storage and updates profile', async () => {
    const profile = createMockProfile({
      user_id: 'user-123',
      avatar_url: 'https://avatars.example.com/avatars/user-123-12345.jpeg',
    })
    mockRepository.findByUserId = vi.fn().mockResolvedValue(profile)
    mockRepository.update = vi.fn().mockResolvedValue({ ...profile, avatar_url: null })

    await sut.execute('user-123')

    expect(mockStorage.delete).toHaveBeenCalledWith('avatars/user-123-12345.jpeg')
  })

  it('skips storage deletion when avatar_url is null', async () => {
    const profile = createMockProfile({ user_id: 'user-123', avatar_url: null })
    mockRepository.findByUserId = vi.fn().mockResolvedValue(profile)
    mockRepository.update = vi.fn().mockResolvedValue(profile)

    await sut.execute('user-123')

    expect(mockStorage.delete).not.toHaveBeenCalled()
  })

  it('skips storage deletion when avatar_url is external', async () => {
    const profile = createMockProfile({
      user_id: 'user-123',
      avatar_url: 'https://external.com/avatar.jpg',
    })
    mockRepository.findByUserId = vi.fn().mockResolvedValue(profile)
    mockRepository.update = vi.fn().mockResolvedValue({ ...profile, avatar_url: null })

    await sut.execute('user-123')

    expect(mockStorage.delete).not.toHaveBeenCalled()
  })

  it('throws NOT_FOUND error when profile does not exist', async () => {
    mockRepository.findByUserId = vi.fn().mockResolvedValue(null)

    await expect(sut.execute('user-123')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws NOT_FOUND error when profile update fails', async () => {
    const profile = createMockProfile()
    mockRepository.findByUserId = vi.fn().mockResolvedValue(profile)
    mockRepository.update = vi.fn().mockResolvedValue(null)

    await expect(sut.execute('user-123')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('continues even if storage deletion fails', async () => {
    const profile = createMockProfile({
      user_id: 'user-123',
      avatar_url: 'https://avatars.example.com/avatars/user-123-12345.jpeg',
    })
    mockRepository.findByUserId = vi.fn().mockResolvedValue(profile)
    mockRepository.update = vi.fn().mockResolvedValue({ ...profile, avatar_url: null })
    mockStorage.delete = vi.fn().mockRejectedValue(new Error('Storage error'))

    await expect(sut.execute('user-123')).resolves.toBeUndefined()
  })
})
