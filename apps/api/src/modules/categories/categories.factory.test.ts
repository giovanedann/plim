import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCategoriesDependencies } from './categories.factory'

vi.mock('../../lib/env', () => ({
  createSupabaseClientWithAuth: vi.fn(() => ({ mock: 'supabase-client' })),
}))

vi.mock('./categories.repository')
vi.mock('./list-categories.usecase')
vi.mock('./create-category.usecase')
vi.mock('./update-category.usecase')
vi.mock('./delete-category.usecase')

import { createSupabaseClientWithAuth } from '../../lib/env'
import type { Bindings } from '../../lib/env'
import { CategoriesRepository } from './categories.repository'
import { CreateCategoryUseCase } from './create-category.usecase'
import { DeleteCategoryUseCase } from './delete-category.usecase'
import { ListCategoriesUseCase } from './list-categories.usecase'
import { UpdateCategoryUseCase } from './update-category.usecase'

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

describe('createCategoriesDependencies', () => {
  const mockEnv = createMockEnv()
  const mockAccessToken = 'test-access-token'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates Supabase client with correct options', () => {
    createCategoriesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(createSupabaseClientWithAuth).toHaveBeenCalledWith(mockEnv, mockAccessToken)
  })

  it('creates repository with Supabase client', () => {
    createCategoriesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(CategoriesRepository).toHaveBeenCalledWith({ mock: 'supabase-client' })
  })

  it('returns repository instance', () => {
    const sut = createCategoriesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut.repository).toBeInstanceOf(CategoriesRepository)
  })

  it('creates ListCategoriesUseCase with repository', () => {
    const sut = createCategoriesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(ListCategoriesUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.listCategories).toBeInstanceOf(ListCategoriesUseCase)
  })

  it('creates CreateCategoryUseCase with repository', () => {
    const sut = createCategoriesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(CreateCategoryUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.createCategory).toBeInstanceOf(CreateCategoryUseCase)
  })

  it('creates UpdateCategoryUseCase with repository', () => {
    const sut = createCategoriesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(UpdateCategoryUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.updateCategory).toBeInstanceOf(UpdateCategoryUseCase)
  })

  it('creates DeleteCategoryUseCase with repository', () => {
    const sut = createCategoriesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(DeleteCategoryUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.deleteCategory).toBeInstanceOf(DeleteCategoryUseCase)
  })

  it('returns all expected dependencies', () => {
    const sut = createCategoriesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut).toHaveProperty('repository')
    expect(sut).toHaveProperty('listCategories')
    expect(sut).toHaveProperty('createCategory')
    expect(sut).toHaveProperty('updateCategory')
    expect(sut).toHaveProperty('deleteCategory')
  })
})
