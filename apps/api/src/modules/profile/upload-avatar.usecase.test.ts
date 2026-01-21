import { ERROR_CODES, HTTP_STATUS, type Profile } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ProfileRepository } from './profile.repository'
import { type AvatarStorage, UploadAvatarUseCase } from './upload-avatar.usecase'

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

function createMockFile(options: { size?: number; type?: string } = {}): File {
  const { size = 1024, type = 'image/jpeg' } = options
  const blob = new Blob([new ArrayBuffer(size)], { type })
  return new File([blob], 'test.jpg', { type })
}

describe('UploadAvatarUseCase', () => {
  let useCase: UploadAvatarUseCase
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
    useCase = new UploadAvatarUseCase(
      mockRepository as unknown as ProfileRepository,
      mockStorage,
      publicUrl
    )
  })

  it('uploads avatar and returns URL', async () => {
    const file = createMockFile()
    const updatedProfile = {
      ...mockProfile,
      avatar_url: 'https://avatars.example.com/avatars/user-123-12345.jpeg',
    }
    mockRepository.update.mockResolvedValue(updatedProfile)

    const result = await useCase.execute('user-123', file)

    expect(result.avatar_url).toMatch(
      /^https:\/\/avatars\.example\.com\/avatars\/user-123-\d+\.jpeg$/
    )
    expect(mockStorage.put).toHaveBeenCalled()
    expect(mockRepository.update).toHaveBeenCalled()
  })

  it('throws FILE_TOO_LARGE error when file exceeds 5MB', async () => {
    const file = createMockFile({ size: 6 * 1024 * 1024 })

    await expect(useCase.execute('user-123', file)).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123', file)).rejects.toMatchObject({
      code: ERROR_CODES.FILE_TOO_LARGE,
      status: HTTP_STATUS.BAD_REQUEST,
    })
  })

  it('throws INVALID_FILE_TYPE error for non-image files', async () => {
    const file = createMockFile({ type: 'application/pdf' })

    await expect(useCase.execute('user-123', file)).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123', file)).rejects.toMatchObject({
      code: ERROR_CODES.INVALID_FILE_TYPE,
      status: HTTP_STATUS.BAD_REQUEST,
    })
  })

  it('accepts JPEG files', async () => {
    const file = createMockFile({ type: 'image/jpeg' })
    mockRepository.update.mockResolvedValue({ ...mockProfile, avatar_url: 'url' })

    await expect(useCase.execute('user-123', file)).resolves.toBeDefined()
  })

  it('accepts PNG files', async () => {
    const file = createMockFile({ type: 'image/png' })
    mockRepository.update.mockResolvedValue({ ...mockProfile, avatar_url: 'url' })

    await expect(useCase.execute('user-123', file)).resolves.toBeDefined()
  })

  it('accepts WebP files', async () => {
    const file = createMockFile({ type: 'image/webp' })
    mockRepository.update.mockResolvedValue({ ...mockProfile, avatar_url: 'url' })

    await expect(useCase.execute('user-123', file)).resolves.toBeDefined()
  })

  it('accepts GIF files', async () => {
    const file = createMockFile({ type: 'image/gif' })
    mockRepository.update.mockResolvedValue({ ...mockProfile, avatar_url: 'url' })

    await expect(useCase.execute('user-123', file)).resolves.toBeDefined()
  })

  it('throws UPLOAD_FAILED error when storage fails', async () => {
    const file = createMockFile()
    mockStorage.put = vi.fn().mockRejectedValue(new Error('Storage error'))

    await expect(useCase.execute('user-123', file)).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123', file)).rejects.toMatchObject({
      code: ERROR_CODES.UPLOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  it('throws NOT_FOUND error when profile update fails', async () => {
    const file = createMockFile()
    mockRepository.update.mockResolvedValue(null)

    await expect(useCase.execute('user-123', file)).rejects.toThrow(AppError)
    await expect(useCase.execute('user-123', file)).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })
})
