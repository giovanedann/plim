import { type AvatarUploadResponse, ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ProfileRepository } from './profile.repository'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface AvatarStorage {
  put(
    key: string,
    data: ArrayBuffer,
    options?: { httpMetadata?: { contentType: string } }
  ): Promise<unknown>
  delete(key: string): Promise<void>
}

export class UploadAvatarUseCase {
  constructor(
    private profileRepository: ProfileRepository,
    private avatarStorage: AvatarStorage,
    private publicUrl: string
  ) {}

  async execute(userId: string, file: File): Promise<AvatarUploadResponse> {
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        ERROR_CODES.FILE_TOO_LARGE,
        'File size exceeds 5MB limit',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new AppError(
        ERROR_CODES.INVALID_FILE_TYPE,
        'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const extension = 'webp' // Client always sends optimized webp
    const timestamp = Date.now()
    const key = `avatars/${userId}-${timestamp}.${extension}`

    const arrayBuffer = await file.arrayBuffer()

    try {
      await this.avatarStorage.put(key, arrayBuffer, {
        httpMetadata: { contentType: file.type },
      })
    } catch {
      throw new AppError(
        ERROR_CODES.UPLOAD_FAILED,
        'Failed to upload avatar',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    const avatarUrl = `${this.publicUrl}/${key}`

    const profile = await this.profileRepository.update(userId, { avatar_url: avatarUrl })

    if (!profile) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Profile not found', HTTP_STATUS.NOT_FOUND)
    }

    return { avatar_url: avatarUrl }
  }
}
