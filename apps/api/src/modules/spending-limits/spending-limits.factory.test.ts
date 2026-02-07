import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpendingLimitsDependencies } from './spending-limits.factory'

vi.mock('../../lib/env', () => ({
  createSupabaseClientWithAuth: vi.fn(() => ({ mock: 'supabase-client' })),
}))

vi.mock('./spending-limits.repository')
vi.mock('./get-spending-limit.usecase')
vi.mock('./upsert-spending-limit.usecase')

import { createSupabaseClientWithAuth } from '../../lib/env'
import type { Bindings } from '../../lib/env'
import { GetSpendingLimitUseCase } from './get-spending-limit.usecase'
import { SpendingLimitsRepository } from './spending-limits.repository'
import { UpsertSpendingLimitUseCase } from './upsert-spending-limit.usecase'

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
    MERCADO_PAGO_ACCESS_TOKEN: 'test-mp-token',
    MERCADO_PAGO_WEBHOOK_SECRET: 'test-mp-webhook-secret',
    API_BASE_URL: 'https://api.test.plim.app.br',
  }
}

describe('createSpendingLimitsDependencies', () => {
  const mockEnv = createMockEnv()
  const mockAccessToken = 'test-access-token'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates Supabase client with correct options', () => {
    createSpendingLimitsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(createSupabaseClientWithAuth).toHaveBeenCalledWith(mockEnv, mockAccessToken)
  })

  it('creates repository with Supabase client', () => {
    createSpendingLimitsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(SpendingLimitsRepository).toHaveBeenCalledWith({ mock: 'supabase-client' })
  })

  it('returns repository instance', () => {
    const sut = createSpendingLimitsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut.repository).toBeInstanceOf(SpendingLimitsRepository)
  })

  it('creates GetSpendingLimitUseCase with repository', () => {
    const sut = createSpendingLimitsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetSpendingLimitUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getSpendingLimit).toBeInstanceOf(GetSpendingLimitUseCase)
  })

  it('creates UpsertSpendingLimitUseCase with repository', () => {
    const sut = createSpendingLimitsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(UpsertSpendingLimitUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.upsertSpendingLimit).toBeInstanceOf(UpsertSpendingLimitUseCase)
  })

  it('returns all expected dependencies', () => {
    const sut = createSpendingLimitsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut).toHaveProperty('repository')
    expect(sut).toHaveProperty('getSpendingLimit')
    expect(sut).toHaveProperty('upsertSpendingLimit')
  })
})
