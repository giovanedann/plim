import { createMockExpense, createMockSalaryHistory } from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetDashboardUseCase } from './get-dashboard.usecase'

type MockRepository = {
  getExpensesForPeriod: ReturnType<typeof vi.fn>
  getExpensesWithCreditCards: ReturnType<typeof vi.fn>
  getSalariesForPeriod: ReturnType<typeof vi.fn>
  getFutureExpenses: ReturnType<typeof vi.fn>
  aggregateByCategory: ReturnType<typeof vi.fn>
  aggregateByPaymentMethod: ReturnType<typeof vi.fn>
  aggregateByCreditCard: ReturnType<typeof vi.fn>
  aggregateExpensesByTimeline: ReturnType<typeof vi.fn>
  calculateMonthlyIncomeExpenses: ReturnType<typeof vi.fn>
  calculateSavingsRate: ReturnType<typeof vi.fn>
  formatSalaryTimeline: ReturnType<typeof vi.fn>
  calculateInstallmentForecast: ReturnType<typeof vi.fn>
  getTotalIncome: ReturnType<typeof vi.fn>
  getTotalExpenses: ReturnType<typeof vi.fn>
  getPreviousPeriodData: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesForPeriod: vi.fn().mockResolvedValue([]),
    getExpensesWithCreditCards: vi.fn().mockResolvedValue([]),
    getSalariesForPeriod: vi.fn().mockResolvedValue([]),
    getFutureExpenses: vi.fn().mockResolvedValue([]),
    aggregateByCategory: vi.fn().mockReturnValue([]),
    aggregateByPaymentMethod: vi.fn().mockReturnValue([]),
    aggregateByCreditCard: vi.fn().mockReturnValue([]),
    aggregateExpensesByTimeline: vi.fn().mockReturnValue([]),
    calculateMonthlyIncomeExpenses: vi.fn().mockReturnValue([]),
    calculateSavingsRate: vi.fn().mockReturnValue([]),
    formatSalaryTimeline: vi.fn().mockReturnValue([]),
    calculateInstallmentForecast: vi.fn().mockReturnValue([]),
    getTotalIncome: vi.fn().mockResolvedValue(500000),
    getTotalExpenses: vi.fn().mockResolvedValue(300000),
    getPreviousPeriodData: vi.fn().mockResolvedValue({
      income: 480000,
      expenses: 310000,
      balance: 170000,
    }),
  }
}

describe('GetDashboardUseCase', () => {
  let sut: GetDashboardUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))

    mockRepository = createMockDashboardRepository()
    sut = new GetDashboardUseCase(mockRepository as unknown as DashboardRepository)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns complete dashboard data', async () => {
    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('expensesTimeline')
    expect(result).toHaveProperty('incomeVsExpenses')
    expect(result).toHaveProperty('categoryBreakdown')
    expect(result).toHaveProperty('paymentBreakdown')
    expect(result).toHaveProperty('creditCardBreakdown')
    expect(result).toHaveProperty('savingsRate')
    expect(result).toHaveProperty('salaryTimeline')
    expect(result).toHaveProperty('installmentForecast')
  })

  it('uses default group_by of day when not specified', async () => {
    await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(mockRepository.aggregateExpensesByTimeline).toHaveBeenCalledWith([], 'day')
  })

  it('uses provided group_by parameter', async () => {
    await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'month',
    })

    expect(mockRepository.aggregateExpensesByTimeline).toHaveBeenCalledWith([], 'month')
  })

  describe('data aggregation', () => {
    it('aggregates expenses and salaries correctly', async () => {
      const expenses = [
        createMockExpense({ amount_cents: 10000, date: '2024-01-15' }),
        createMockExpense({ amount_cents: 20000, date: '2024-01-20' }),
      ]
      const salaries = [createMockSalaryHistory({ amount_cents: 500000 })]

      mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
      mockRepository.getSalariesForPeriod.mockResolvedValue(salaries)
      mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue([
        { month: '2024-01', income: 500000, expenses: 30000 },
      ])

      const result = await sut.execute('user-123', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })

      expect(result.summary.total_income).toBe(500000)
      expect(result.summary.total_expenses).toBe(30000)
    })
  })

  describe('boundary cases', () => {
    it('handles empty data across all metrics', async () => {
      mockRepository.getTotalIncome.mockResolvedValue(0)
      mockRepository.getTotalExpenses.mockResolvedValue(0)
      mockRepository.getPreviousPeriodData.mockResolvedValue({
        income: 0,
        expenses: 0,
        balance: 0,
      })

      const result = await sut.execute('user-123', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })

      expect(result.summary.total_income).toBe(0)
      expect(result.summary.total_expenses).toBe(0)
      expect(result.summary.balance).toBe(0)
    })
  })
})
