import { createMockExpense, createMockSalaryHistory } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardRepository } from './dashboard.repository'
import { GetIncomeVsExpensesUseCase } from './get-income-vs-expenses.usecase'

type MockRepository = {
  getExpensesForPeriod: ReturnType<typeof vi.fn>
  getSalariesForPeriod: ReturnType<typeof vi.fn>
  calculateMonthlyIncomeExpenses: ReturnType<typeof vi.fn>
}

function createMockDashboardRepository(): MockRepository {
  return {
    getExpensesForPeriod: vi.fn(),
    getSalariesForPeriod: vi.fn(),
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
    const incomeExpensesData = [{ month: '2024-01', income: 500000, expenses: 30000 }]

    mockRepository.getExpensesForPeriod.mockResolvedValue(expenses)
    mockRepository.getSalariesForPeriod.mockResolvedValue(salaries)
    mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue(incomeExpensesData)

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.data).toEqual(incomeExpensesData)
  })

  it('returns empty data when no expenses or salaries', async () => {
    mockRepository.getExpensesForPeriod.mockResolvedValue([])
    mockRepository.getSalariesForPeriod.mockResolvedValue([])
    mockRepository.calculateMonthlyIncomeExpenses.mockReturnValue([])

    const result = await sut.execute('user-123', {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    expect(result.data).toEqual([])
  })
})
