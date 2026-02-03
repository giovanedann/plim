import { ERROR_CODES, HTTP_STATUS, createMockProfile } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ProfileRepository } from './profile.repository'
import { type AvatarStorage, UploadAvatarUseCase } from './upload-avatar.usecase'

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

function createMockFile(options: { size?: number; type?: string } = {}): File {
  const { size = 1024, type = 'image/jpeg' } = options
  const blob = new Blob([new ArrayBuffer(size)], { type })
  return new File([blob], 'test.jpg', { type })
}

describe('UploadAvatarUseCase', () => {
  let sut: UploadAvatarUseCase
  let mockRepository: MockRepository
  let mockStorage: AvatarStorage
  const publicUrl = 'https://avatars.example.com'

  beforeEach(() => {
    mockRepository = createMockRepository()
    mockStorage = createMockStorage()
    sut = new UploadAvatarUseCase(mockRepository as ProfileRepository, mockStorage, publicUrl)
  })

  it('uploads avatar and returns URL', async () => {
    const file = createMockFile()
    const profile = createMockProfile({
      user_id: 'user-123',
      avatar_url: 'https://avatars.example.com/avatars/user-123-12345.webp',
    })
    mockRepository.update = vi.fn().mockResolvedValue(profile)

    const result = await sut.execute('user-123', file)

    expect(result.avatar_url).toMatch(
      /^https:\/\/avatars\.example\.com\/avatars\/user-123-\d+\.webp$/
    )
  })

  describe('boundary and edge cases', () => {
    it('throws FILE_TOO_LARGE error when file exceeds 5MB', async () => {
      const file = createMockFile({ size: 6 * 1024 * 1024 })

      await expect(sut.execute('user-123', file)).rejects.toThrow(AppError)
      await expect(sut.execute('user-123', file)).rejects.toMatchObject({
        code: ERROR_CODES.FILE_TOO_LARGE,
        status: HTTP_STATUS.BAD_REQUEST,
      })
    })

    it('accepts file at exactly 5MB limit', async () => {
      const file = createMockFile({ size: 5 * 1024 * 1024 })
      const profile = createMockProfile({ avatar_url: 'url' })
      mockRepository.update = vi.fn().mockResolvedValue(profile)

      await expect(sut.execute('user-123', file)).resolves.toBeDefined()
    })

    it('throws INVALID_FILE_TYPE error for non-image files', async () => {
      const file = createMockFile({ type: 'application/pdf' })

      await expect(sut.execute('user-123', file)).rejects.toThrow(AppError)
      await expect(sut.execute('user-123', file)).rejects.toMatchObject({
        code: ERROR_CODES.INVALID_FILE_TYPE,
        status: HTTP_STATUS.BAD_REQUEST,
      })
    })
  })

  describe('supported file types', () => {
    it('accepts JPEG files', async () => {
      const file = createMockFile({ type: 'image/jpeg' })
      const profile = createMockProfile({ avatar_url: 'url' })
      mockRepository.update = vi.fn().mockResolvedValue(profile)

      await expect(sut.execute('user-123', file)).resolves.toBeDefined()
    })

    it('accepts PNG files', async () => {
      const file = createMockFile({ type: 'image/png' })
      const profile = createMockProfile({ avatar_url: 'url' })
      mockRepository.update = vi.fn().mockResolvedValue(profile)

      await expect(sut.execute('user-123', file)).resolves.toBeDefined()
    })

    it('accepts WebP files', async () => {
      const file = createMockFile({ type: 'image/webp' })
      const profile = createMockProfile({ avatar_url: 'url' })
      mockRepository.update = vi.fn().mockResolvedValue(profile)

      await expect(sut.execute('user-123', file)).resolves.toBeDefined()
    })

    it('accepts GIF files', async () => {
      const file = createMockFile({ type: 'image/gif' })
      const profile = createMockProfile({ avatar_url: 'url' })
      mockRepository.update = vi.fn().mockResolvedValue(profile)

      await expect(sut.execute('user-123', file)).resolves.toBeDefined()
    })
  })

  describe('error handling', () => {
    it('throws UPLOAD_FAILED error when storage fails', async () => {
      const file = createMockFile()
      mockStorage.put = vi.fn().mockRejectedValue(new Error('Storage error'))

      await expect(sut.execute('user-123', file)).rejects.toThrow(AppError)
      await expect(sut.execute('user-123', file)).rejects.toMatchObject({
        code: ERROR_CODES.UPLOAD_FAILED,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      })
    })

    it('throws NOT_FOUND error when profile update fails', async () => {
      const file = createMockFile()
      mockRepository.update = vi.fn().mockResolvedValue(null)

      await expect(sut.execute('user-123', file)).rejects.toThrow(AppError)
      await expect(sut.execute('user-123', file)).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      })
    })
  })
})
