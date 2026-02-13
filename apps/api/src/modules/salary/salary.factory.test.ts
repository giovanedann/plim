import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSalaryDependencies } from './salary.factory'

vi.mock('../../lib/env', () => ({
  createSupabaseClientWithAuth: vi.fn(() => ({ mock: 'supabase-client' })),
}))

vi.mock('./salary.repository')
vi.mock('./get-salary.usecase')
vi.mock('./list-salary-history.usecase')
vi.mock('./create-salary.usecase')

import { createSupabaseClientWithAuth } from '../../lib/env'
import type { Bindings } from '../../lib/env'
import { CreateSalaryUseCase } from './create-salary.usecase'
import { GetSalaryUseCase } from './get-salary.usecase'
import { ListSalaryHistoryUseCase } from './list-salary-history.usecase'
import { SalaryRepository } from './salary.repository'

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
    POSTHOG_API_KEY: '',
    POSTHOG_HOST: '',
    BETTERSTACK_SOURCE_TOKEN: '',
  }
}

describe('createSalaryDependencies', () => {
  const mockEnv = createMockEnv()
  const mockAccessToken = 'test-access-token'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates Supabase client with correct options', () => {
    createSalaryDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(createSupabaseClientWithAuth).toHaveBeenCalledWith(mockEnv, mockAccessToken)
  })

  it('creates repository with Supabase client', () => {
    createSalaryDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(SalaryRepository).toHaveBeenCalledWith({ mock: 'supabase-client' })
  })

  it('returns repository instance', () => {
    const sut = createSalaryDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut.repository).toBeInstanceOf(SalaryRepository)
  })

  it('creates GetSalaryUseCase with repository', () => {
    const sut = createSalaryDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetSalaryUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getSalary).toBeInstanceOf(GetSalaryUseCase)
  })

  it('creates ListSalaryHistoryUseCase with repository', () => {
    const sut = createSalaryDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(ListSalaryHistoryUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.listSalaryHistory).toBeInstanceOf(ListSalaryHistoryUseCase)
  })

  it('creates CreateSalaryUseCase with repository', () => {
    const sut = createSalaryDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(CreateSalaryUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.createSalary).toBeInstanceOf(CreateSalaryUseCase)
  })

  it('returns all expected dependencies', () => {
    const sut = createSalaryDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut).toHaveProperty('repository')
    expect(sut).toHaveProperty('getSalary')
    expect(sut).toHaveProperty('listSalaryHistory')
    expect(sut).toHaveProperty('createSalary')
  })
})
