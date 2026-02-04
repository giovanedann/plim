import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAccountDependencies } from './account.factory'

const mockUserSupabase = { mock: 'user-supabase-client' }
const mockAdminSupabase = { mock: 'admin-supabase-client' }

vi.mock('../../lib/env', () => ({
  createSupabaseClientWithAuth: vi.fn(() => mockUserSupabase),
  createSupabaseAdminClient: vi.fn(() => mockAdminSupabase),
}))

vi.mock('./account.repository')
vi.mock('./export-data.usecase')
vi.mock('./delete-account.usecase')

import { createSupabaseAdminClient, createSupabaseClientWithAuth } from '../../lib/env'
import type { Bindings } from '../../lib/env'
import { AccountRepository } from './account.repository'
import { DeleteAccountUseCase } from './delete-account.usecase'
import { ExportDataUseCase } from './export-data.usecase'

function createMockEnv(): Bindings {
  return {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'test-key',
    SUPABASE_ACCOUNT_DELETE_SECRET_KEY: 'test-secret',
    AVATARS_BUCKET: {} as R2Bucket,
    R2_PUBLIC_URL: 'https://r2.test.com',
    ENVIRONMENT: 'development',
    UPSTASH_REDIS_REST_URL: 'https://redis.test.com',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    GEMINI_API_KEY: 'test-gemini-key',
  }
}

describe('createAccountDependencies', () => {
  const mockEnv = createMockEnv()
  const mockAccessToken = 'test-access-token'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates user Supabase client with correct options', () => {
    createAccountDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(createSupabaseClientWithAuth).toHaveBeenCalledWith(mockEnv, mockAccessToken)
  })

  it('creates admin Supabase client', () => {
    createAccountDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(createSupabaseAdminClient).toHaveBeenCalledWith(mockEnv)
  })

  it('creates repository with user Supabase client', () => {
    createAccountDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(AccountRepository).toHaveBeenCalledWith(mockUserSupabase)
  })

  it('returns repository instance', () => {
    const sut = createAccountDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut.repository).toBeInstanceOf(AccountRepository)
  })

  it('creates ExportDataUseCase with repository', () => {
    const sut = createAccountDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(ExportDataUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.exportData).toBeInstanceOf(ExportDataUseCase)
  })

  it('creates DeleteAccountUseCase with both user and admin clients', () => {
    createAccountDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(DeleteAccountUseCase).toHaveBeenCalledWith(mockUserSupabase, mockAdminSupabase)
  })

  it('returns DeleteAccountUseCase instance', () => {
    const sut = createAccountDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut.deleteAccount).toBeInstanceOf(DeleteAccountUseCase)
  })

  it('returns all expected dependencies', () => {
    const sut = createAccountDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut).toHaveProperty('repository')
    expect(sut).toHaveProperty('exportData')
    expect(sut).toHaveProperty('deleteAccount')
  })
})
