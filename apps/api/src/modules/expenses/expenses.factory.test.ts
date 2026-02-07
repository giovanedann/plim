import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createExpensesDependencies } from './expenses.factory'

vi.mock('../../lib/env', () => ({
  createSupabaseClientWithAuth: vi.fn(() => ({ mock: 'supabase-client' })),
}))

vi.mock('../ai/ai.repository')
vi.mock('./expenses.repository')
vi.mock('./list-expenses.usecase')
vi.mock('./get-expense.usecase')
vi.mock('./create-expense.usecase')
vi.mock('./update-expense.usecase')
vi.mock('./delete-expense.usecase')
vi.mock('./get-installment-group.usecase')
vi.mock('./delete-installment-group.usecase')

import { createSupabaseClientWithAuth } from '../../lib/env'
import type { Bindings } from '../../lib/env'
import { CreateExpenseUseCase } from './create-expense.usecase'
import { DeleteExpenseUseCase } from './delete-expense.usecase'
import { DeleteInstallmentGroupUseCase } from './delete-installment-group.usecase'
import { ExpensesRepository } from './expenses.repository'
import { GetExpenseUseCase } from './get-expense.usecase'
import { GetInstallmentGroupUseCase } from './get-installment-group.usecase'
import { ListExpensesUseCase } from './list-expenses.usecase'
import { UpdateExpenseUseCase } from './update-expense.usecase'

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

describe('createExpensesDependencies', () => {
  const mockEnv = createMockEnv()
  const mockAccessToken = 'test-access-token'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates Supabase client with correct options', () => {
    createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(createSupabaseClientWithAuth).toHaveBeenCalledWith(mockEnv, mockAccessToken)
  })

  it('creates repository with Supabase client and cache invalidation callback', () => {
    createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(ExpensesRepository).toHaveBeenCalledWith(
      { mock: 'supabase-client' },
      expect.any(Function)
    )
  })

  it('returns repository instance', () => {
    const sut = createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut.repository).toBeInstanceOf(ExpensesRepository)
  })

  it('creates ListExpensesUseCase with repository', () => {
    const sut = createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(ListExpensesUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.listExpenses).toBeInstanceOf(ListExpensesUseCase)
  })

  it('creates GetExpenseUseCase with repository', () => {
    const sut = createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetExpenseUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getExpense).toBeInstanceOf(GetExpenseUseCase)
  })

  it('creates CreateExpenseUseCase with repository', () => {
    const sut = createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(CreateExpenseUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.createExpense).toBeInstanceOf(CreateExpenseUseCase)
  })

  it('creates UpdateExpenseUseCase with repository', () => {
    const sut = createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(UpdateExpenseUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.updateExpense).toBeInstanceOf(UpdateExpenseUseCase)
  })

  it('creates DeleteExpenseUseCase with repository', () => {
    const sut = createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(DeleteExpenseUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.deleteExpense).toBeInstanceOf(DeleteExpenseUseCase)
  })

  it('creates GetInstallmentGroupUseCase with repository', () => {
    const sut = createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetInstallmentGroupUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getInstallmentGroup).toBeInstanceOf(GetInstallmentGroupUseCase)
  })

  it('creates DeleteInstallmentGroupUseCase with repository', () => {
    const sut = createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(DeleteInstallmentGroupUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.deleteInstallmentGroup).toBeInstanceOf(DeleteInstallmentGroupUseCase)
  })

  it('returns all expected dependencies', () => {
    const sut = createExpensesDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut).toHaveProperty('repository')
    expect(sut).toHaveProperty('listExpenses')
    expect(sut).toHaveProperty('getExpense')
    expect(sut).toHaveProperty('createExpense')
    expect(sut).toHaveProperty('updateExpense')
    expect(sut).toHaveProperty('deleteExpense')
    expect(sut).toHaveProperty('getInstallmentGroup')
    expect(sut).toHaveProperty('deleteInstallmentGroup')
  })
})
