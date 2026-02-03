import { createMockExpense, createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetSavingsRateUseCase } from './get-savings-rate.usecase'

type MockRepository = {
  getExpensesForPeriod: ReturnType<typeof vi.fn>
  getSalariesForPeriod: ReturnType<typeof vi.fn>
  calculateMonthlyIncomeExpenses: ReturnType<typeof vi.fn>
  calculateSavingsRate: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesForPeriod: vi.fn(),
    getSalariesForPeriod: vi.fn(),
    calculateMonthlyIncomeExpenses: vi.fn(),
    calculateSavingsRate: vi.fn(),
  }
}

describe('GetSavingsRateUseCase', () => {
  let sut: GetSavingsRateUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetSavingsRateUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns savings rate for period', async () => {
    const expenses = [createMockExpense({ date: '2024-01-15', amount_cents: 30000 })]
    const salaries = [
      createMockSalaryHistory({ effective_from: '2024-01-01', amount_cents: 500000 }),
    ]
    const incomeExpenses = [{ month: '2024-01', income: 500000, expenses: 30000 }]
    const savingsData = [{ month: '2024-01', rate: 94 }]

    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.getSalariesForPeriod.mockResolvedValue(salaries)
    mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue(incomeExpenses)
    mockRepository.calculateSavingsRate.mockReturnValue(savingsData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.data).toEqual(savingsData)
  })

  it('returns negative savings rate when expenses exceed income', async () => {
    const expenses = [createMockExpense({ date: '2024-01-15', amount_cents: 600000 })]
    const salaries = [
      createMockSalaryHistory({ effective_from: '2024-01-01', amount_cents: 500000 }),
    ]
    const incomeExpenses = [{ month: '2024-01', income: 500000, expenses: 600000 }]
    const savingsData = [{ month: '2024-01', rate: -20 }]

    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.getSalariesForPeriod.mockResolvedValue(salaries)
    mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue(incomeExpenses)
    mockRepository.calculateSavingsRate.mockReturnValue(savingsData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.data[0]!.rate).toBe(-20)
  })

  it('returns empty data when no income or expenses', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.getSalariesForPeriod.mockResolvedValue([])
    mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue([])
    mockRepository.calculateSavingsRate.mockReturnValue([])

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.data).toEqual([])
  })

  describe('boundary cases', () => {
    it('handles zero income with expenses', async () => {
      const expenses = [createMockExpense({ amount_cents: 10000 })]
      const incomeExpenses = [{ month: '2024-01', income: 0, expenses: 10000 }]
      const savingsData = [{ month: '2024-01', rate: -100 }]

      mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
      mockRepository.getSalariesForPeriod.mockResolvedValue([])
      mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue(incomeExpenses)
      mockRepository.calculateSavingsRate.mockReturnValue(savingsData)

      const result = await sut.execute('user-123', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })

      expect(result.data[0]!.rate).toBe(-100)
    })

    it('handles 100% savings rate', async () => {
      const salaries = [createMockSalaryHistory({ amount_cents: 500000 })]
      const incomeExpenses = [{ month: '2024-01', income: 500000, expenses: 0 }]
      const savingsData = [{ month: '2024-01', rate: 100 }]

      mockRepository.getExpensesForPeriod.mockResolvedValue([])
      mockRepository.getSalariesForPeriod.mockResolvedValue(salaries)
      mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue(incomeExpenses)
      mockRepository.calculateSavingsRate.mockReturnValue(savingsData)

      const result = await sut.execute('user-123', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })

      expect(result.data[0]!.rate).toBe(100)
    })
  })
})
