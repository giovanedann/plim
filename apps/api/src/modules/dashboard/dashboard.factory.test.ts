import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDashboardDependencies } from './dashboard.factory'

vi.mock('../../lib/env', () => ({
  createSupabaseClientWithAuth: vi.fn(() => ({ mock: 'supabase-client' })),
}))

vi.mock('./dashboard.repository')
vi.mock('./get-dashboard.usecase')
vi.mock('./get-summary.usecase')
vi.mock('./get-expenses-timeline.usecase')
vi.mock('./get-income-vs-expenses.usecase')
vi.mock('./get-category-breakdown.usecase')
vi.mock('./get-payment-breakdown.usecase')
vi.mock('./get-credit-card-breakdown.usecase')
vi.mock('./get-savings-rate.usecase')
vi.mock('./get-salary-timeline.usecase')
vi.mock('./get-installment-forecast.usecase')

import { createSupabaseClientWithAuth } from '../../lib/env'
import type { Bindings } from '../../lib/env'
import { DashboardRepository } from './dashboard.repository'
import { GetCategoryBreakdownUseCase } from './get-category-breakdown.usecase'
import { GetCreditCardBreakdownUseCase } from './get-credit-card-breakdown.usecase'
import { GetDashboardUseCase } from './get-dashboard.usecase'
import { GetExpensesTimelineUseCase } from './get-expenses-timeline.usecase'
import { GetIncomeVsExpensesUseCase } from './get-income-vs-expenses.usecase'
import { GetInstallmentForecastUseCase } from './get-installment-forecast.usecase'
import { GetPaymentBreakdownUseCase } from './get-payment-breakdown.usecase'
import { GetSalaryTimelineUseCase } from './get-salary-timeline.usecase'
import { GetSavingsRateUseCase } from './get-savings-rate.usecase'
import { GetSummaryUseCase } from './get-summary.usecase'

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

describe('createDashboardDependencies', () => {
  const mockEnv = createMockEnv()
  const mockAccessToken = 'test-access-token'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates Supabase client with correct options', () => {
    createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(createSupabaseClientWithAuth).toHaveBeenCalledWith(mockEnv, mockAccessToken)
  })

  it('creates repository with Supabase client', () => {
    createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(DashboardRepository).toHaveBeenCalledWith({ mock: 'supabase-client' })
  })

  it('returns repository instance', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut.repository).toBeInstanceOf(DashboardRepository)
  })

  it('creates GetDashboardUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetDashboardUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getDashboard).toBeInstanceOf(GetDashboardUseCase)
  })

  it('creates GetSummaryUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetSummaryUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getSummary).toBeInstanceOf(GetSummaryUseCase)
  })

  it('creates GetExpensesTimelineUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetExpensesTimelineUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getExpensesTimeline).toBeInstanceOf(GetExpensesTimelineUseCase)
  })

  it('creates GetIncomeVsExpensesUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetIncomeVsExpensesUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getIncomeVsExpenses).toBeInstanceOf(GetIncomeVsExpensesUseCase)
  })

  it('creates GetCategoryBreakdownUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetCategoryBreakdownUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getCategoryBreakdown).toBeInstanceOf(GetCategoryBreakdownUseCase)
  })

  it('creates GetPaymentBreakdownUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetPaymentBreakdownUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getPaymentBreakdown).toBeInstanceOf(GetPaymentBreakdownUseCase)
  })

  it('creates GetCreditCardBreakdownUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetCreditCardBreakdownUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getCreditCardBreakdown).toBeInstanceOf(GetCreditCardBreakdownUseCase)
  })

  it('creates GetSavingsRateUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetSavingsRateUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getSavingsRate).toBeInstanceOf(GetSavingsRateUseCase)
  })

  it('creates GetSalaryTimelineUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetSalaryTimelineUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getSalaryTimeline).toBeInstanceOf(GetSalaryTimelineUseCase)
  })

  it('creates GetInstallmentForecastUseCase with repository', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(GetInstallmentForecastUseCase).toHaveBeenCalledWith(sut.repository)
    expect(sut.getInstallmentForecast).toBeInstanceOf(GetInstallmentForecastUseCase)
  })

  it('returns all expected dependencies', () => {
    const sut = createDashboardDependencies({ env: mockEnv, accessToken: mockAccessToken })

    expect(sut).toHaveProperty('repository')
    expect(sut).toHaveProperty('getDashboard')
    expect(sut).toHaveProperty('getSummary')
    expect(sut).toHaveProperty('getExpensesTimeline')
    expect(sut).toHaveProperty('getIncomeVsExpenses')
    expect(sut).toHaveProperty('getCategoryBreakdown')
    expect(sut).toHaveProperty('getPaymentBreakdown')
    expect(sut).toHaveProperty('getCreditCardBreakdown')
    expect(sut).toHaveProperty('getSavingsRate')
    expect(sut).toHaveProperty('getSalaryTimeline')
    expect(sut).toHaveProperty('getInstallmentForecast')
  })
})
