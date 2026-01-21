import { ERROR_CODES, HTTP_STATUS, type Profile } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { DeleteAvatarUseCase } from './delete-avatar.usecase'
import type { ProfileRepository } from './profile.repository'
import type { AvatarStorage } from './upload-avatar.usecase'

const mockProfile: Profile = {
  user_id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  avatar_url: null,
  currency: 'BRL',
  locale: 'pt-BR',
  is_onboarded: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('DeleteAvatarUseCase', () => {
  let useCase: DeleteAvatarUseCase
  let mockRepository: { findByUserId: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  let mockStorage: AvatarStorage
  const publicUrl = 'https://avatars.example.com'

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      update: vi.fn(),
    }
    mockStorage = {
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    useCase = new DeleteAvatarUseCase(
      mockRepository as unknown as ProfileRepository,
      mockStorage,
      publicUrl
    )
  })

  it('deletes avatar from storage and updates profile', async () => {
    const profileWithAvatar = {
      ...mockProfile,
      avatar_url: 'https://avatars.example.com/avatars/user-123-12345.jpeg',
    }
    mockRepository.findByUserId.mockResolvedValue(profileWithAvatar)
    mockRepository.update.mockResolvedValue({ ...mockProfile, avatar_url: null })

    await useCase.execute('user-123')

    expect(mockStorage.delete).toHaveBeenCalledWith('avatars/user-123-12345.jpeg')
    expect(mockRepository.update).toHaveBeenCalledWith('user-123', { avatar_url: null })
  })

  it('skips storage deletion when avatar_url is null', async () => {
    mockRepository.findByUserId.mockResolvedValue(mockProfile)
    mockRepository.update.mockResolvedValue(mockProfile)

    await useCase.execute('user-123')

    expect(mockStorage.delete).not.toHaveBeenCalled()
    expect(mockRepository.update).toHaveBeenCalledWith('user-123', { avatar_url: null })
  })

  it('skips storage deletion when avatar_url is external', async () => {
    const profileWithExternalAvatar = {
      ...mockProfile,
      avatar_url: 'https://external.com/avatar.jpg',
    }
    mockRepository.findByUserId.mockResolvedValue(profileWithExternalAvatar)
    mockRepository.update.mockResolvedValue({ ...mockProfile, avatar_url: null })

    await useCase.execute('user-123')

    expect(mockStorage.delete).not.toHaveBeenCalled()
    expect(mockRepository.update).toHaveBeenCalledWith('user-123', { avatar_url: null })
  })

  it('throws NOT_FOUND error when profile does not exist', async () => {
    mockRepository.findByUserId.mockResolvedValue(null)

    await expect(useCase.execute('user-123')).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws NOT_FOUND error when profile update fails', async () => {
    mockRepository.findByUserId.mockResolvedValue(mockProfile)
    mockRepository.update.mockResolvedValue(null)

    await expect(useCase.execute('user-123')).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('continues even if storage deletion fails', async () => {
    const profileWithAvatar = {
      ...mockProfile,
      avatar_url: 'https://avatars.example.com/avatars/user-123-12345.jpeg',
    }
    mockRepository.findByUserId.mockResolvedValue(profileWithAvatar)
    mockRepository.update.mockResolvedValue({ ...mockProfile, avatar_url: null })
    mockStorage.delete = vi.fn().mockRejectedValue(new Error('Storage error'))

    await expect(useCase.execute('user-123')).resolves.toBeUndefined()
    expect(mockRepository.update).toHaveBeenCalledWith('user-123', { avatar_url: null })
  })
})
