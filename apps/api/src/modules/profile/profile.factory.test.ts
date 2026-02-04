import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProfileDependencies } from './profile.factory'

vi.mock('../../lib/env', () => ({
  createSupabaseClientWithAuth: vi.fn(() => ({ mock: 'supabase-client' })),
}))

vi.mock('./profile.repository')
vi.mock('./get-profile.usecase')
vi.mock('./update-profile.usecase')
vi.mock('./upload-avatar.usecase')
vi.mock('./delete-avatar.usecase')

import { createSupabaseClientWithAuth } from '../../lib/env'
import type { Bindings } from '../../lib/env'
import { DeleteAvatarUseCase } from './delete-avatar.usecase'
import { GetProfileUseCase } from './get-profile.usecase'
import { ProfileRepository } from './profile.repository'
import { UpdateProfileUseCase } from './update-profile.usecase'
import { UploadAvatarUseCase } from './upload-avatar.usecase'

function createMockEnv(): Bindings {
  return {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'test-key',
    SUPABASE_ACCOUNT_DELETE_SECRET_KEY: 'test-secret',
    AVATARS_BUCKET: { put: vi.fn(), delete: vi.fn() } as unknown as R2Bucket,
    R2_PUBLIC_URL: 'https://r2.test.com',
    ENVIRONMENT: 'development',
    UPSTASH_REDIS_REST_URL: 'https://redis.test.com',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    GEMINI_API_KEY: 'test-gemini-key',
  }
}

describe('createProfileDependencies', () => {
  const mockEnv = createMockEnv()
  const mockAccessToken = 'test-access-token'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates Supabase client with correct options', () => {
    createProfileDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(createSupabaseClientWithAuth).toHaveBeenCalledWith(mockEnv, mockAccessToken)
  })

  it('creates repository with Supabase client', () => {
    createProfileDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(ProfileRepository).toHaveBeenCalledWith({ mock: 'supabase-client' })
  })

  it('returns repository instance', () => {
    const sut = createProfileDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut.repository).toBeInstanceOf(ProfileRepository)
  })

  it('creates GetProfileUseCase with repository', () => {
    const sut = createProfileDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetProfileUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getProfile).toBeInstanceOf(GetProfileUseCase)
  })

  it('creates UpdateProfileUseCase with repository', () => {
    const sut = createProfileDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(UpdateProfileUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.updateProfile).toBeInstanceOf(UpdateProfileUseCase)
  })

  it('creates UploadAvatarUseCase with repository and R2 config', () => {
    const sut = createProfileDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(UploadAvatarUseCase).toHaveBeenCalledWith(
      sut.repository,
      mockEnv.AVATARS_BUCKET,
      mockEnv.R2_PUBLIC_URL
    )
    expect(sut.uploadAvatar).toBeInstanceOf(UploadAvatarUseCase)
  })

  it('creates DeleteAvatarUseCase with repository and R2 config', () => {
    const sut = createProfileDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(DeleteAvatarUseCase).toHaveBeenCalledWith(
      sut.repository,
      mockEnv.AVATARS_BUCKET,
      mockEnv.R2_PUBLIC_URL
    )
    expect(sut.deleteAvatar).toBeInstanceOf(DeleteAvatarUseCase)
  })

  it('returns all expected dependencies', () => {
    const sut = createProfileDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut).toHaveProperty('repository')
    expect(sut).toHaveProperty('getProfile')
    expect(sut).toHaveProperty('updateProfile')
    expect(sut).toHaveProperty('uploadAvatar')
    expect(sut).toHaveProperty('deleteAvatar')
  })
})
