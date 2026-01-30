import type { DashboardQuery, TimelineGroupBy } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardRepository } from './dashboard.repository'

function createMockSupabaseClient() {
  const mockOrder = vi.fn()
  const mockIn = vi.fn()
  const mockEq = vi.fn()
  const mockGte = vi.fn()
  const mockLte = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  const chainMethods = {
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    in: mockIn,
    order: mockOrder,
    select: mockSelect,
  }

  mockFrom.mockReturnValue({
    select: mockSelect,
  })

  mockSelect.mockReturnValue(chainMethods)
  mockEq.mockReturnValue(chainMethods)
  mockGte.mockReturnValue(chainMethods)
  mockLte.mockReturnValue(chainMethods)
  mockIn.mockReturnValue(chainMethods)
  mockOrder.mockReturnValue(chainMethods)

  const supabase = {
    from: mockFrom,
  } as unknown as SupabaseClient

  return {
    supabase,
    mockFrom,
    mockSelect,
    mockEq,
    mockGte,
    mockLte,
    mockIn,
    mockOrder,
  }
}

interface ExpenseRow {
  date: string
  amount_cents: number
  payment_method: string
  category_id: string
  category_name: string
  category_color: string | null
  category_icon: string | null
  installment_group_id: string | null
  installment_total: number | null
  installment_current: number | null
  description: string
}

interface ExpenseWithCreditCardRow {
  date: string
  amount_cents: number
  credit_card_id: string | null
  credit_card_name: string | null
  credit_card_color: string | null
  credit_card_bank: string | null
  credit_card_flag: string | null
}

interface SalaryRow {
  amount_cents: number
  effective_from: string
}

function createMockExpenseRow(overrides: Partial<ExpenseRow> = {}): ExpenseRow {
  return {
    date: '2024-01-15',
    amount_cents: 5000,
    payment_method: 'credit_card',
    category_id: 'cat-1',
    category_name: 'Food',
    category_color: '#ff0000',
    category_icon: 'food',
    installment_group_id: null,
    installment_total: null,
    installment_current: null,
    description: 'Test expense',
    ...overrides,
  }
}

function createMockSalaryRow(overrides: Partial<SalaryRow> = {}): SalaryRow {
  return {
    amount_cents: 500000,
    effective_from: '2024-01-01',
    ...overrides,
  }
}

describe('DashboardRepository', () => {
  let sut: DashboardRepository
  let mocks: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mocks = createMockSupabaseClient()
    sut = new DashboardRepository(mocks.supabase)
  })

  describe('getExpensesForPeriod', () => {
    it('returns expenses with category data for the period', async () => {
      // Arrange
      const userId = 'user-123'
      const query: DashboardQuery = { start_date: '2024-01-01', end_date: '2024-01-31' }
      const rawData = [
        {
          date: '2024-01-15',
          amount_cents: 5000,
          payment_method: 'credit_card',
          category_id: 'cat-1',
          category: { name: 'Food', color: '#ff0000', icon: 'food' },
          installment_group_id: null,
          installment_total: null,
          installment_current: null,
          description: 'Lunch',
        },
      ]
      mocks.mockOrder.mockResolvedValue({ data: rawData, error: null })

      // Act
      const result = await sut.getExpensesForPeriod(userId, query)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        date: '2024-01-15',
        amount_cents: 5000,
        payment_method: 'credit_card',
        category_id: 'cat-1',
        category_name: 'Food',
        category_color: '#ff0000',
        category_icon: 'food',
        installment_group_id: null,
        installment_total: null,
        installment_current: null,
        description: 'Lunch',
      })
      expect(mocks.mockFrom).toHaveBeenCalledWith('expense')
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
      expect(mocks.mockGte).toHaveBeenCalledWith('date', query.start_date)
      expect(mocks.mockLte).toHaveBeenCalledWith('date', query.end_date)
    })

    it('returns "Sem categoria" when category is null', async () => {
      // Arrange
      const userId = 'user-123'
      const query: DashboardQuery = { start_date: '2024-01-01', end_date: '2024-01-31' }
      const rawData = [
        {
          date: '2024-01-15',
          amount_cents: 5000,
          payment_method: 'pix',
          category_id: 'cat-unknown',
          category: null,
          installment_group_id: null,
          installment_total: null,
          installment_current: null,
          description: 'Unknown',
        },
      ]
      mocks.mockOrder.mockResolvedValue({ data: rawData, error: null })

      // Act
      const result = await sut.getExpensesForPeriod(userId, query)

      // Assert
      expect(result[0]?.category_name).toBe('Sem categoria')
      expect(result[0]?.category_color).toBeNull()
      expect(result[0]?.category_icon).toBeNull()
    })

    it('returns empty array on error', async () => {
      // Arrange
      const userId = 'user-123'
      const query: DashboardQuery = { start_date: '2024-01-01', end_date: '2024-01-31' }
      mocks.mockOrder.mockResolvedValue({ data: null, error: new Error('Query failed') })

      // Act
      const result = await sut.getExpensesForPeriod(userId, query)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getSalariesForPeriod', () => {
    it('returns salaries effective within the period', async () => {
      // Arrange
      const userId = 'user-123'
      const query: DashboardQuery = { start_date: '2024-01-01', end_date: '2024-06-30' }
      const salaries = [
        createMockSalaryRow({ effective_from: '2024-01-01', amount_cents: 500000 }),
        createMockSalaryRow({ effective_from: '2024-04-01', amount_cents: 550000 }),
      ]
      mocks.mockOrder.mockResolvedValue({ data: salaries, error: null })

      // Act
      const result = await sut.getSalariesForPeriod(userId, query)

      // Assert
      expect(result).toEqual(salaries)
      expect(mocks.mockFrom).toHaveBeenCalledWith('salary_history')
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
      expect(mocks.mockLte).toHaveBeenCalledWith('effective_from', query.end_date)
    })

    it('returns empty array on error', async () => {
      // Arrange
      const userId = 'user-123'
      const query: DashboardQuery = { start_date: '2024-01-01', end_date: '2024-01-31' }
      mocks.mockOrder.mockResolvedValue({ data: null, error: new Error('Query failed') })

      // Act
      const result = await sut.getSalariesForPeriod(userId, query)

      // Assert
      expect(result).toEqual([])
    })
  })

  // Note: getFutureExpenses has complex query chains that are difficult to mock.
  // The method's business logic is tested through integration tests.

  describe('getExpensesWithCreditCards', () => {
    it('queries expenses with credit card payment methods', async () => {
      // Arrange
      const userId = 'user-123'
      const query: DashboardQuery = { start_date: '2024-01-01', end_date: '2024-01-31' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.getExpensesWithCreditCards(userId, query)

      // Assert
      expect(mocks.mockFrom).toHaveBeenCalledWith('expense')
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
      expect(mocks.mockIn).toHaveBeenCalledWith('payment_method', ['credit_card', 'debit_card'])
    })

    it('returns empty array on expenses query error', async () => {
      // Arrange
      const userId = 'user-123'
      const query: DashboardQuery = { start_date: '2024-01-01', end_date: '2024-01-31' }
      mocks.mockOrder.mockResolvedValue({ data: null, error: new Error('Query failed') })

      // Act
      const result = await sut.getExpensesWithCreditCards(userId, query)

      // Assert
      expect(result).toEqual([])
    })

    it('returns expenses with null credit card data when no credit_card_id', async () => {
      // Arrange
      const userId = 'user-123'
      const query: DashboardQuery = { start_date: '2024-01-01', end_date: '2024-01-31' }
      const expenses = [{ date: '2024-01-15', amount_cents: 5000, credit_card_id: null }]
      mocks.mockOrder.mockResolvedValue({ data: expenses, error: null })

      // Act
      const result = await sut.getExpensesWithCreditCards(userId, query)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        date: '2024-01-15',
        amount_cents: 5000,
        credit_card_id: null,
        credit_card_name: null,
        credit_card_color: null,
        credit_card_bank: null,
        credit_card_flag: null,
      })
    })
  })

  describe('aggregateExpensesByTimeline', () => {
    it('groups expenses by day', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ date: '2024-01-15', amount_cents: 1000 }),
        createMockExpenseRow({ date: '2024-01-15', amount_cents: 2000 }),
        createMockExpenseRow({ date: '2024-01-16', amount_cents: 500 }),
      ]
      const groupBy: TimelineGroupBy = 'day'

      // Act
      const result = sut.aggregateExpensesByTimeline(expenses, groupBy)

      // Assert
      expect(result).toEqual([
        { date: '2024-01-15', amount: 3000 },
        { date: '2024-01-16', amount: 500 },
      ])
    })

    it('groups expenses by month', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ date: '2024-01-15', amount_cents: 1000 }),
        createMockExpenseRow({ date: '2024-01-20', amount_cents: 2000 }),
        createMockExpenseRow({ date: '2024-02-05', amount_cents: 500 }),
      ]
      const groupBy: TimelineGroupBy = 'month'

      // Act
      const result = sut.aggregateExpensesByTimeline(expenses, groupBy)

      // Assert
      expect(result).toEqual([
        { date: '2024-01', amount: 3000 },
        { date: '2024-02', amount: 500 },
      ])
    })

    it('groups expenses by week', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ date: '2024-01-15', amount_cents: 1000 }), // Monday
        createMockExpenseRow({ date: '2024-01-17', amount_cents: 2000 }), // Wednesday same week
        createMockExpenseRow({ date: '2024-01-22', amount_cents: 500 }), // Monday next week
      ]
      const groupBy: TimelineGroupBy = 'week'

      // Act
      const result = sut.aggregateExpensesByTimeline(expenses, groupBy)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]?.amount).toBe(3000)
      expect(result[1]?.amount).toBe(500)
    })

    it('returns empty array for empty expenses', () => {
      // Arrange
      const expenses: ExpenseRow[] = []
      const groupBy: TimelineGroupBy = 'day'

      // Act
      const result = sut.aggregateExpensesByTimeline(expenses, groupBy)

      // Assert
      expect(result).toEqual([])
    })

    it('sorts results by date ascending', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ date: '2024-01-20', amount_cents: 500 }),
        createMockExpenseRow({ date: '2024-01-15', amount_cents: 1000 }),
      ]
      const groupBy: TimelineGroupBy = 'day'

      // Act
      const result = sut.aggregateExpensesByTimeline(expenses, groupBy)

      // Assert
      expect(result[0]?.date).toBe('2024-01-15')
      expect(result[1]?.date).toBe('2024-01-20')
    })
  })

  describe('aggregateByCategory', () => {
    it('groups expenses by category with percentages', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({
          category_id: 'cat-1',
          category_name: 'Food',
          category_color: '#ff0000',
          category_icon: 'food',
          amount_cents: 6000,
        }),
        createMockExpenseRow({
          category_id: 'cat-1',
          category_name: 'Food',
          category_color: '#ff0000',
          category_icon: 'food',
          amount_cents: 4000,
        }),
        createMockExpenseRow({
          category_id: 'cat-2',
          category_name: 'Transport',
          category_color: '#00ff00',
          category_icon: 'car',
          amount_cents: 10000,
        }),
      ]
      const total = 20000

      // Act
      const result = sut.aggregateByCategory(expenses, total)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        category_id: 'cat-1',
        name: 'Food',
        color: '#ff0000',
        icon: 'food',
        amount: 10000,
        percentage: 50,
      })
      expect(result[1]).toEqual({
        category_id: 'cat-2',
        name: 'Transport',
        color: '#00ff00',
        icon: 'car',
        amount: 10000,
        percentage: 50,
      })
    })

    it('sorts by amount descending', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ category_id: 'cat-1', amount_cents: 1000 }),
        createMockExpenseRow({ category_id: 'cat-2', amount_cents: 5000 }),
      ]
      const total = 6000

      // Act
      const result = sut.aggregateByCategory(expenses, total)

      // Assert
      expect(result[0]?.category_id).toBe('cat-2')
      expect(result[1]?.category_id).toBe('cat-1')
    })

    it('returns zero percentage when total is zero', () => {
      // Arrange
      const expenses: ExpenseRow[] = [createMockExpenseRow({ amount_cents: 0 })]
      const total = 0

      // Act
      const result = sut.aggregateByCategory(expenses, total)

      // Assert
      expect(result[0]?.percentage).toBe(0)
    })
  })

  describe('aggregateByPaymentMethod', () => {
    it('groups expenses by payment method with percentages', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ payment_method: 'credit_card', amount_cents: 7000 }),
        createMockExpenseRow({ payment_method: 'credit_card', amount_cents: 3000 }),
        createMockExpenseRow({ payment_method: 'pix', amount_cents: 10000 }),
      ]
      const total = 20000

      // Act
      const result = sut.aggregateByPaymentMethod(expenses, total)

      // Assert
      expect(result).toHaveLength(2)
      expect(result).toContainEqual({ method: 'credit_card', amount: 10000, percentage: 50 })
      expect(result).toContainEqual({ method: 'pix', amount: 10000, percentage: 50 })
    })

    it('sorts by amount descending', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ payment_method: 'cash', amount_cents: 1000 }),
        createMockExpenseRow({ payment_method: 'pix', amount_cents: 5000 }),
      ]
      const total = 6000

      // Act
      const result = sut.aggregateByPaymentMethod(expenses, total)

      // Assert
      expect(result[0]?.method).toBe('pix')
      expect(result[1]?.method).toBe('cash')
    })

    it('returns zero percentage when total is zero', () => {
      // Arrange
      const expenses: ExpenseRow[] = [createMockExpenseRow({ amount_cents: 0 })]
      const total = 0

      // Act
      const result = sut.aggregateByPaymentMethod(expenses, total)

      // Assert
      expect(result[0]?.percentage).toBe(0)
    })
  })

  describe('aggregateByCreditCard', () => {
    it('groups expenses by credit card with percentages', () => {
      // Arrange
      const expenses: ExpenseWithCreditCardRow[] = [
        {
          date: '2024-01-15',
          amount_cents: 5000,
          credit_card_id: 'card-1',
          credit_card_name: 'Card A',
          credit_card_color: '#ff0000',
          credit_card_bank: 'Bank A',
          credit_card_flag: 'visa',
        },
        {
          date: '2024-01-16',
          amount_cents: 5000,
          credit_card_id: 'card-1',
          credit_card_name: 'Card A',
          credit_card_color: '#ff0000',
          credit_card_bank: 'Bank A',
          credit_card_flag: 'visa',
        },
        {
          date: '2024-01-17',
          amount_cents: 10000,
          credit_card_id: null,
          credit_card_name: null,
          credit_card_color: null,
          credit_card_bank: null,
          credit_card_flag: null,
        },
      ]
      const total = 20000

      // Act
      const result = sut.aggregateByCreditCard(expenses, total)

      // Assert
      expect(result).toHaveLength(2)
      // Both have same amount, check that both entries exist with correct data
      const cardEntry = result.find((r) => r.credit_card_id === 'card-1')
      const noCardEntry = result.find((r) => r.credit_card_id === null)

      expect(cardEntry).toEqual({
        credit_card_id: 'card-1',
        name: 'Card A',
        color: '#ff0000',
        bank: 'Bank A',
        flag: 'visa',
        amount: 10000,
        percentage: 50,
      })
      expect(noCardEntry).toEqual({
        credit_card_id: null,
        name: 'Sem cartão',
        color: '#94a3b8',
        bank: '',
        flag: '',
        amount: 10000,
        percentage: 50,
      })
    })

    it('uses default values for expenses without credit card', () => {
      // Arrange
      const expenses: ExpenseWithCreditCardRow[] = [
        {
          date: '2024-01-15',
          amount_cents: 1000,
          credit_card_id: null,
          credit_card_name: null,
          credit_card_color: null,
          credit_card_bank: null,
          credit_card_flag: null,
        },
      ]
      const total = 1000

      // Act
      const result = sut.aggregateByCreditCard(expenses, total)

      // Assert
      expect(result[0]?.name).toBe('Sem cartão')
      expect(result[0]?.color).toBe('#94a3b8')
      expect(result[0]?.credit_card_id).toBeNull()
    })
  })

  describe('calculateMonthlyIncomeExpenses', () => {
    it('calculates income and expenses for each month', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ date: '2024-01-15', amount_cents: 10000 }),
        createMockExpenseRow({ date: '2024-01-20', amount_cents: 5000 }),
        createMockExpenseRow({ date: '2024-02-10', amount_cents: 8000 }),
      ]
      const salaries: SalaryRow[] = [
        createMockSalaryRow({ effective_from: '2024-01-01', amount_cents: 500000 }),
      ]
      const startDate = '2024-01-01'
      const endDate = '2024-02-28'

      // Act
      const result = sut.calculateMonthlyIncomeExpenses(expenses, salaries, startDate, endDate)

      // Assert
      expect(result).toEqual([
        { month: '2024-01', income: 500000, expenses: 15000 },
        { month: '2024-02', income: 500000, expenses: 8000 },
      ])
    })

    it('uses correct salary for each month when salary changes', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ date: '2024-01-15', amount_cents: 10000 }),
        createMockExpenseRow({ date: '2024-03-15', amount_cents: 10000 }),
      ]
      const salaries: SalaryRow[] = [
        createMockSalaryRow({ effective_from: '2024-01-01', amount_cents: 500000 }),
        createMockSalaryRow({ effective_from: '2024-02-01', amount_cents: 600000 }),
      ]
      const startDate = '2024-01-01'
      const endDate = '2024-03-31'

      // Act
      const result = sut.calculateMonthlyIncomeExpenses(expenses, salaries, startDate, endDate)

      // Assert
      expect(result[0]?.income).toBe(500000)
      expect(result[1]?.income).toBe(600000)
      expect(result[2]?.income).toBe(600000)
    })

    it('returns zero income when no salary is effective', () => {
      // Arrange
      const expenses: ExpenseRow[] = [
        createMockExpenseRow({ date: '2024-01-15', amount_cents: 10000 }),
      ]
      const salaries: SalaryRow[] = []
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'

      // Act
      const result = sut.calculateMonthlyIncomeExpenses(expenses, salaries, startDate, endDate)

      // Assert
      expect(result[0]?.income).toBe(0)
    })
  })

  describe('calculateSavingsRate', () => {
    it('calculates savings rate for each month', () => {
      // Arrange
      const incomeExpenses = [
        { month: '2024-01', income: 100000, expenses: 60000 },
        { month: '2024-02', income: 100000, expenses: 80000 },
      ]

      // Act
      const result = sut.calculateSavingsRate(incomeExpenses)

      // Assert
      expect(result).toEqual([
        { month: '2024-01', rate: 40 },
        { month: '2024-02', rate: 20 },
      ])
    })

    it('returns zero rate when income is zero', () => {
      // Arrange
      const incomeExpenses = [{ month: '2024-01', income: 0, expenses: 5000 }]

      // Act
      const result = sut.calculateSavingsRate(incomeExpenses)

      // Assert
      expect(result[0]?.rate).toBe(0)
    })

    it('returns negative rate when expenses exceed income', () => {
      // Arrange
      const incomeExpenses = [{ month: '2024-01', income: 100000, expenses: 120000 }]

      // Act
      const result = sut.calculateSavingsRate(incomeExpenses)

      // Assert
      expect(result[0]?.rate).toBe(-20)
    })
  })

  describe('formatSalaryTimeline', () => {
    it('formats salaries as timeline data points', () => {
      // Arrange
      const salaries: SalaryRow[] = [
        createMockSalaryRow({ effective_from: '2024-01-01', amount_cents: 500000 }),
        createMockSalaryRow({ effective_from: '2024-06-01', amount_cents: 550000 }),
      ]

      // Act
      const result = sut.formatSalaryTimeline(salaries)

      // Assert
      expect(result).toEqual([
        { date: '2024-01-01', amount: 500000 },
        { date: '2024-06-01', amount: 550000 },
      ])
    })

    it('returns empty array for empty salaries', () => {
      // Arrange
      const salaries: SalaryRow[] = []

      // Act
      const result = sut.formatSalaryTimeline(salaries)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('calculateInstallmentForecast', () => {
    it('calculates installment totals by month', () => {
      // Arrange
      const installments = [
        { amount_cents: 3334, date: '2024-01-15' },
        { amount_cents: 3334, date: '2024-01-20' },
        { amount_cents: 3334, date: '2024-02-15' },
        { amount_cents: 3334, date: '2024-03-15' },
      ]
      const months = 6

      // Act
      const result = sut.calculateInstallmentForecast(installments, months)

      // Assert
      expect(result).toEqual([
        { month: '2024-01', total: 6668 },
        { month: '2024-02', total: 3334 },
        { month: '2024-03', total: 3334 },
      ])
    })

    it('limits result to specified number of months', () => {
      // Arrange
      const installments = [
        { amount_cents: 1000, date: '2024-01-15' },
        { amount_cents: 1000, date: '2024-02-15' },
        { amount_cents: 1000, date: '2024-03-15' },
        { amount_cents: 1000, date: '2024-04-15' },
      ]
      const months = 2

      // Act
      const result = sut.calculateInstallmentForecast(installments, months)

      // Assert
      expect(result).toHaveLength(2)
    })

    it('returns empty array when no installments', () => {
      // Arrange
      const installments: { amount_cents: number; date: string }[] = []
      const months = 6

      // Act
      const result = sut.calculateInstallmentForecast(installments, months)

      // Assert
      expect(result).toEqual([])
    })
  })
})
