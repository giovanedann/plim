import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCreditCardsDependencies } from './credit-cards.factory'

vi.mock('../../lib/env', () => ({
  createSupabaseClientWithAuth: vi.fn(() => ({ mock: 'supabase-client' })),
}))

vi.mock('./credit-cards.repository')
vi.mock('./list-credit-cards.usecase')
vi.mock('./create-credit-card.usecase')
vi.mock('./update-credit-card.usecase')
vi.mock('./delete-credit-card.usecase')

import { createSupabaseClientWithAuth } from '../../lib/env'
import type { Bindings } from '../../lib/env'
import { CreateCreditCardUseCase } from './create-credit-card.usecase'
import { CreditCardsRepository } from './credit-cards.repository'
import { DeleteCreditCardUseCase } from './delete-credit-card.usecase'
import { ListCreditCardsUseCase } from './list-credit-cards.usecase'
import { UpdateCreditCardUseCase } from './update-credit-card.usecase'

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
  }
}

describe('createCreditCardsDependencies', () => {
  const mockEnv = createMockEnv()
  const mockAccessToken = 'test-access-token'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates Supabase client with correct options', () => {
    createCreditCardsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(createSupabaseClientWithAuth).toHaveBeenCalledWith(mockEnv, mockAccessToken)
  })

  it('creates repository with Supabase client', () => {
    createCreditCardsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(CreditCardsRepository).toHaveBeenCalledWith({ mock: 'supabase-client' })
  })

  it('returns repository instance', () => {
    const sut = createCreditCardsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut.repository).toBeInstanceOf(CreditCardsRepository)
  })

  it('creates ListCreditCardsUseCase with repository', () => {
    const sut = createCreditCardsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(ListCreditCardsUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.listCreditCards).toBeInstanceOf(ListCreditCardsUseCase)
  })

  it('creates CreateCreditCardUseCase with repository', () => {
    const sut = createCreditCardsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(CreateCreditCardUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.createCreditCard).toBeInstanceOf(CreateCreditCardUseCase)
  })

  it('creates UpdateCreditCardUseCase with repository', () => {
    const sut = createCreditCardsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(UpdateCreditCardUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.updateCreditCard).toBeInstanceOf(UpdateCreditCardUseCase)
  })

  it('creates DeleteCreditCardUseCase with repository', () => {
    const sut = createCreditCardsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(DeleteCreditCardUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.deleteCreditCard).toBeInstanceOf(DeleteCreditCardUseCase)
  })

  it('returns all expected dependencies', () => {
    const sut = createCreditCardsDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut).toHaveProperty('repository')
    expect(sut).toHaveProperty('listCreditCards')
    expect(sut).toHaveProperty('createCreditCard')
    expect(sut).toHaveProperty('updateCreditCard')
    expect(sut).toHaveProperty('deleteCreditCard')
  })
})
