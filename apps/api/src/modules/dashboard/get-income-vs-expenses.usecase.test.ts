import { createMockExpense, createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetIncomeVsExpensesUseCase } from './get-income-vs-expenses.usecase'

type MockRepository = {
  getExpensesForPeriod: ReturnType<typeof vi.fn>
  getSalariesForPeriod: ReturnType<typeof vi.fn>
  getIncomesForPeriod: ReturnType<typeof vi.fn>
  calculateMonthlyIncomeExpenses: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesForPeriod: vi.fn(),
    getSalariesForPeriod: vi.fn(),
    getIncomesForPeriod: vi.fn(),
    calculateMonthlyIncomeExpenses: vi.fn(),
  }
}

describe('GetIncomeVsExpensesUseCase', () => {
  let sut: GetIncomeVsExpensesUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockDashboardRepository()
    sut = new GetIncomeVsExpensesUseCase(mockRepository as unknown as DashboardRepository)
  })

  it('returns income vs expenses comparison', async () => {
    const expenses = [createMockExpense({ date: '2024-01-15', amount_cents: 30000 })]
    const salaries = [
      createMockSalaryHistory({ effective_from: '2024-01-01', amount_cents: 500000 }),
    ]
    const incomes = [{ date: '2024-01-20', amount_cents: 10000, description: 'Freelance' }]
    const incomeExpensesData = [{ month: '2024-01', income: 510000, expenses: 30000 }]

    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.getSalariesForPeriod.mockResolvedValue(salaries)
    mockRepository.getIncomesForPeriod.mockResolvedValue(incomes)
    mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue(incomeExpensesData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.data).toEqual(incomeExpensesData)
    expect(mockRepository.getIncomesForPeriod).toHaveBeenCalledWith('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })
  })

  it('passes incomes to calculateMonthlyIncomeExpenses', async () => {
    const incomes = [{ date: '2024-01-20', amount_cents: 10000, description: 'Freelance' }]

    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.getSalariesForPeriod.mockResolvedValue([])
    mockRepository.getIncomesForPeriod.mockResolvedValue(incomes)
    mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue([])

    await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(mockRepository.calculateMonthlyIncomeExpenses).toHaveBeenCalledWith(
      [],
      [],
      '2024-01-01',
      '2024-01-31',
      incomes
    )
  })

  it('returns empty data when no expenses, salaries, or incomes', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.getSalariesForPeriod.mockResolvedValue([])
    mockRepository.getIncomesForPeriod.mockResolvedValue([])
    mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue([])

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.data).toEqual([])
  })
})
