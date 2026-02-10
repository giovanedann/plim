import { createMockExpense } from '@plim/shared'
import type { DashboardData, Expense, ExpenseFilters } from '@plim/shared'
import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ExpenseChange,
  addExpensesToCache,
  applyOptimisticDashboardUpdate,
  applyOptimisticExpenseAdd,
  applyOptimisticExpenseGroupRemove,
  applyOptimisticExpenseRemove,
  applyOptimisticExpenseUpdate,
  rollbackDashboardUpdate,
  rollbackExpensesUpdate,
  updateDashboardOptimistically,
} from './optimistic-updates'
import { queryKeys } from './query-config'

function createMockDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    summary: {
      total_income: 500000,
      total_expenses: 200000,
      balance: 300000,
      savings_rate: 60,
      comparison: {
        income_change_percent: 0,
        expenses_change_percent: 0,
        balance_change_percent: 0,
      },
    },
    expensesTimeline: {
      data: [{ date: '2026-01-15', amount: 100000 }],
      group_by: 'day',
    },
    incomeVsExpenses: {
      data: [{ month: '2026-01', income: 500000, expenses: 200000 }],
    },
    categoryBreakdown: {
      data: [
        {
          category_id: 'cat-001',
          name: 'Food',
          color: '#FF5733',
          icon: 'utensils',
          amount: 100000,
          percentage: 50,
        },
        {
          category_id: 'cat-002',
          name: 'Transport',
          color: '#3357FF',
          icon: 'car',
          amount: 100000,
          percentage: 50,
        },
      ],
      total: 200000,
    },
    paymentBreakdown: {
      data: [
        { method: 'pix', amount: 150000, percentage: 75 },
        { method: 'credit_card', amount: 50000, percentage: 25 },
      ],
      total: 200000,
    },
    creditCardBreakdown: {
      data: [
        {
          credit_card_id: 'card-001',
          name: 'Nubank',
          color: '#8A05BE',
          bank: 'nubank',
          flag: 'mastercard',
          amount: 50000,
          percentage: 100,
        },
      ],
      total: 50000,
    },
    savingsRate: {
      data: [{ month: '2026-01', rate: 60 }],
    },
    salaryTimeline: {
      data: [{ date: '2026-01-01', amount: 500000 }],
    },
    installmentForecast: {
      data: [{ month: '2026-02', total: 30000 }],
    },
    ...overrides,
  }
}

function createExpenseChange(overrides: Partial<ExpenseChange> = {}): ExpenseChange {
  return {
    amount_cents: 5000,
    category_id: 'cat-001',
    category_name: 'Food',
    category_color: '#FF5733',
    category_icon: 'utensils',
    payment_method: 'pix',
    date: '2026-01-15',
    operation: 'add',
    ...overrides,
  }
}

describe('optimistic-updates', () => {
  describe('updateDashboardOptimistically', () => {
    it('returns undefined when oldData is undefined', () => {
      const change = createExpenseChange()
      const result = updateDashboardOptimistically(undefined, change, 'day')
      expect(result).toBeUndefined()
    })

    describe('summary updates', () => {
      it('increases total_expenses when adding expense', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({ amount_cents: 10000, operation: 'add' })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        expect(result?.summary.total_expenses).toBe(210000)
        expect(result?.summary.balance).toBe(290000)
      })

      it('decreases total_expenses when removing expense', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({ amount_cents: 10000, operation: 'remove' })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        expect(result?.summary.total_expenses).toBe(190000)
        expect(result?.summary.balance).toBe(310000)
      })

      it('recalculates savings_rate correctly', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({ amount_cents: 100000, operation: 'add' })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        // 500000 income - 300000 expenses = 200000 balance
        // 200000 / 500000 = 40%
        expect(result?.summary.savings_rate).toBe(40)
      })

      it('prevents negative total_expenses', () => {
        const oldData = createMockDashboardData({
          summary: {
            ...createMockDashboardData().summary,
            total_expenses: 5000,
          },
        })
        const change = createExpenseChange({ amount_cents: 10000, operation: 'remove' })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        expect(result?.summary.total_expenses).toBe(0)
      })
    })

    describe('categoryBreakdown updates', () => {
      it('increases existing category amount when adding', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          category_id: 'cat-001',
          amount_cents: 20000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const foodCategory = result?.categoryBreakdown.data.find((c) => c.category_id === 'cat-001')
        expect(foodCategory?.amount).toBe(120000)
        expect(result?.categoryBreakdown.total).toBe(220000)
      })

      it('decreases existing category amount when removing', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          category_id: 'cat-001',
          amount_cents: 30000,
          operation: 'remove',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const foodCategory = result?.categoryBreakdown.data.find((c) => c.category_id === 'cat-001')
        expect(foodCategory?.amount).toBe(70000)
      })

      it('adds new category when not existing', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          category_id: 'cat-new',
          category_name: 'Entertainment',
          amount_cents: 25000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const newCategory = result?.categoryBreakdown.data.find((c) => c.category_id === 'cat-new')
        expect(newCategory).toBeDefined()
        expect(newCategory?.name).toBe('Entertainment')
        expect(newCategory?.amount).toBe(25000)
      })

      it('removes category when amount reaches zero', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          category_id: 'cat-001',
          amount_cents: 100000,
          operation: 'remove',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const removedCategory = result?.categoryBreakdown.data.find(
          (c) => c.category_id === 'cat-001'
        )
        expect(removedCategory).toBeUndefined()
      })

      it('recalculates percentages after update', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          category_id: 'cat-001',
          amount_cents: 100000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        // Food: 200000 / 300000 = 66.7%
        // Transport: 100000 / 300000 = 33.3%
        const foodCategory = result?.categoryBreakdown.data.find((c) => c.category_id === 'cat-001')
        expect(foodCategory?.percentage).toBeCloseTo(66.7, 0)
      })
    })

    describe('paymentBreakdown updates', () => {
      it('increases existing payment method amount', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          payment_method: 'pix',
          amount_cents: 25000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const pixMethod = result?.paymentBreakdown.data.find((p) => p.method === 'pix')
        expect(pixMethod?.amount).toBe(175000)
      })

      it('adds new payment method when not existing', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          payment_method: 'cash',
          amount_cents: 10000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const cashMethod = result?.paymentBreakdown.data.find((p) => p.method === 'cash')
        expect(cashMethod).toBeDefined()
        expect(cashMethod?.amount).toBe(10000)
      })
    })

    describe('creditCardBreakdown updates', () => {
      it('updates credit card breakdown for credit_card payments', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          payment_method: 'credit_card',
          credit_card_id: 'card-001',
          amount_cents: 15000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const card = result?.creditCardBreakdown?.data.find((c) => c.credit_card_id === 'card-001')
        expect(card?.amount).toBe(65000)
      })

      it('ignores non-credit_card payments', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          payment_method: 'pix',
          credit_card_id: 'card-001',
          amount_cents: 15000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        expect(result?.creditCardBreakdown).toEqual(oldData.creditCardBreakdown)
      })

      it('adds new credit card when not existing', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          payment_method: 'credit_card',
          credit_card_id: 'card-new',
          credit_card_name: 'Itau',
          credit_card_color: '#FF6600',
          credit_card_bank: 'itau',
          credit_card_flag: 'visa',
          amount_cents: 20000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const newCard = result?.creditCardBreakdown?.data.find(
          (c) => c.credit_card_id === 'card-new'
        )
        expect(newCard).toBeDefined()
        expect(newCard?.name).toBe('Itau')
        expect(newCard?.bank).toBe('itau')
      })
    })

    describe('expensesTimeline updates', () => {
      it('updates existing date bucket', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          date: '2026-01-15',
          amount_cents: 20000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const bucket = result?.expensesTimeline.data.find((d) => d.date === '2026-01-15')
        expect(bucket?.amount).toBe(120000)
      })

      it('adds new date bucket when not existing', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          date: '2026-01-20',
          amount_cents: 15000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const bucket = result?.expensesTimeline.data.find((d) => d.date === '2026-01-20')
        expect(bucket).toBeDefined()
        expect(bucket?.amount).toBe(15000)
      })

      it('groups by week correctly', () => {
        const oldData = createMockDashboardData({
          expensesTimeline: { data: [], group_by: 'week' },
        })
        // January 15, 2026 is a Thursday, week starts Monday Jan 12
        const change = createExpenseChange({
          date: '2026-01-15',
          amount_cents: 10000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'week')

        const bucket = result?.expensesTimeline.data[0]
        expect(bucket?.date).toBe('2026-01-12')
      })

      it('groups by month correctly', () => {
        const oldData = createMockDashboardData({
          expensesTimeline: { data: [], group_by: 'month' },
        })
        const change = createExpenseChange({
          date: '2026-01-15',
          amount_cents: 10000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'month')

        const bucket = result?.expensesTimeline.data[0]
        expect(bucket?.date).toBe('2026-01-01')
      })
    })

    describe('incomeVsExpenses updates', () => {
      it('updates expenses for existing month', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          date: '2026-01-15',
          amount_cents: 30000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const monthData = result?.incomeVsExpenses?.data.find((d) => d.month === '2026-01')
        expect(monthData?.expenses).toBe(230000)
      })

      it('adds new month when not existing', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({
          date: '2026-02-15',
          amount_cents: 25000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        const monthData = result?.incomeVsExpenses?.data.find((d) => d.month === '2026-02')
        expect(monthData).toBeDefined()
        expect(monthData?.expenses).toBe(25000)
        expect(monthData?.income).toBe(0)
      })
    })

    describe('installmentForecast updates', () => {
      it('ignores non-installment expenses', () => {
        const oldData = createMockDashboardData()
        const change = createExpenseChange({ installment_total: undefined })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        expect(result?.installmentForecast).toEqual(oldData.installmentForecast)
      })

      it('spreads installment across months', () => {
        const oldData = createMockDashboardData({
          installmentForecast: { data: [] },
        })
        const change = createExpenseChange({
          date: '2026-01-15',
          amount_cents: 30000,
          installment_total: 3,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(oldData, change, 'day')

        expect(result!.installmentForecast!.data).toHaveLength(3)
        expect(result!.installmentForecast!.data[0]!.month).toBe('2026-01')
        expect(result!.installmentForecast!.data[1]!.month).toBe('2026-02')
        expect(result!.installmentForecast!.data[2]!.month).toBe('2026-03')
      })
    })

    describe('free user dashboard (null pro fields)', () => {
      const freeTierDashboardData = createMockDashboardData({
        incomeVsExpenses: null,
        creditCardBreakdown: null,
        savingsRate: null,
        salaryTimeline: null,
        installmentForecast: null,
      })

      it('correctly updates summary with free-tier data', () => {
        const change = createExpenseChange({ amount_cents: 10000, operation: 'add' })

        const result = updateDashboardOptimistically(freeTierDashboardData, change, 'day')

        expect(result?.summary.total_expenses).toBe(210000)
        expect(result?.summary.balance).toBe(290000)
        expect(result?.summary.savings_rate).toBe(58)
      })

      it('correctly updates expensesTimeline with free-tier data', () => {
        const change = createExpenseChange({
          date: '2026-01-15',
          amount_cents: 20000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(freeTierDashboardData, change, 'day')

        const bucket = result?.expensesTimeline.data.find((d) => d.date === '2026-01-15')
        expect(bucket?.amount).toBe(120000)
      })

      it('correctly updates categoryBreakdown with free-tier data', () => {
        const change = createExpenseChange({
          category_id: 'cat-001',
          amount_cents: 20000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(freeTierDashboardData, change, 'day')

        const foodCategory = result?.categoryBreakdown.data.find((c) => c.category_id === 'cat-001')
        expect(foodCategory?.amount).toBe(120000)
        expect(result?.categoryBreakdown.total).toBe(220000)
      })

      it('correctly updates paymentBreakdown with free-tier data', () => {
        const change = createExpenseChange({
          payment_method: 'pix',
          amount_cents: 25000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(freeTierDashboardData, change, 'day')

        const pixMethod = result?.paymentBreakdown.data.find((p) => p.method === 'pix')
        expect(pixMethod?.amount).toBe(175000)
      })

      it('preserves null for incomeVsExpenses', () => {
        const change = createExpenseChange({ amount_cents: 10000, operation: 'add' })

        const result = updateDashboardOptimistically(freeTierDashboardData, change, 'day')

        expect(result?.incomeVsExpenses).toBeNull()
      })

      it('preserves null for creditCardBreakdown', () => {
        const change = createExpenseChange({
          payment_method: 'credit_card',
          credit_card_id: 'card-001',
          amount_cents: 10000,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(freeTierDashboardData, change, 'day')

        expect(result?.creditCardBreakdown).toBeNull()
      })

      it('preserves null for savingsRate', () => {
        const change = createExpenseChange({ amount_cents: 10000, operation: 'add' })

        const result = updateDashboardOptimistically(freeTierDashboardData, change, 'day')

        expect(result?.savingsRate).toBeNull()
      })

      it('preserves null for salaryTimeline', () => {
        const change = createExpenseChange({ amount_cents: 10000, operation: 'add' })

        const result = updateDashboardOptimistically(freeTierDashboardData, change, 'day')

        expect(result?.salaryTimeline).toBeNull()
      })

      it('preserves null for installmentForecast', () => {
        const change = createExpenseChange({
          date: '2026-01-15',
          amount_cents: 30000,
          installment_total: 3,
          operation: 'add',
        })

        const result = updateDashboardOptimistically(freeTierDashboardData, change, 'day')

        expect(result?.installmentForecast).toBeNull()
      })
    })
  })

  describe('expenses list optimistic updates', () => {
    let queryClient: QueryClient

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
    })

    afterEach(() => {
      queryClient.clear()
    })

    describe('applyOptimisticExpenseAdd', () => {
      it('adds expense to cache with wrapped response format', () => {
        const existingExpenses = [createMockExpense({ id: 'exp-1', date: '2026-01-10' })]
        queryClient.setQueryData(queryKeys.expenses(), { data: existingExpenses })

        const newExpense = createMockExpense({ id: 'exp-2', date: '2026-01-15' })
        applyOptimisticExpenseAdd(queryClient, newExpense)

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(cachedData!.data).toHaveLength(2)
        expect(cachedData!.data[0]!.id).toBe('exp-2') // Sorted by date desc
      })

      it('adds expense to cache with raw array format', () => {
        const existingExpenses = [createMockExpense({ id: 'exp-1', date: '2026-01-10' })]
        queryClient.setQueryData(queryKeys.expenses(), existingExpenses)

        const newExpense = createMockExpense({ id: 'exp-2', date: '2026-01-15' })
        applyOptimisticExpenseAdd(queryClient, newExpense)

        const cachedData = queryClient.getQueryData<Expense[]>(queryKeys.expenses())
        expect(cachedData).toHaveLength(2)
      })

      it('respects filter matching', () => {
        const filters: ExpenseFilters = { category_id: 'cat-001' }
        queryClient.setQueryData(queryKeys.expenses(filters), { data: [] })

        const matchingExpense = createMockExpense({ category_id: 'cat-001' })
        const nonMatchingExpense = createMockExpense({ category_id: 'cat-002' })

        applyOptimisticExpenseAdd(queryClient, matchingExpense)
        applyOptimisticExpenseAdd(queryClient, nonMatchingExpense)

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(
          queryKeys.expenses(filters)
        )
        expect(cachedData!.data).toHaveLength(1)
        expect(cachedData!.data[0]!.category_id).toBe('cat-001')
      })

      it('returns previous data for rollback', () => {
        const existingExpenses = [createMockExpense({ id: 'exp-1' })]
        queryClient.setQueryData(queryKeys.expenses(), { data: existingExpenses })

        const newExpense = createMockExpense({ id: 'exp-2' })
        const previousData = applyOptimisticExpenseAdd(queryClient, newExpense)

        expect(previousData.size).toBe(1)
      })
    })

    describe('applyOptimisticExpenseUpdate', () => {
      it('updates existing expense in cache', () => {
        const existingExpense = createMockExpense({
          id: 'exp-1',
          description: 'Old description',
        })
        queryClient.setQueryData(queryKeys.expenses(), { data: [existingExpense] })

        const updatedExpense = createMockExpense({
          id: 'exp-1',
          description: 'New description',
        })
        applyOptimisticExpenseUpdate(queryClient, 'exp-1', updatedExpense)

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(cachedData!.data[0]!.description).toBe('New description')
      })

      it('removes expense from filtered cache when no longer matches', () => {
        const filters: ExpenseFilters = { category_id: 'cat-001' }
        const expense = createMockExpense({ id: 'exp-1', category_id: 'cat-001' })
        queryClient.setQueryData(queryKeys.expenses(filters), { data: [expense] })

        const updatedExpense = createMockExpense({ id: 'exp-1', category_id: 'cat-002' })
        applyOptimisticExpenseUpdate(queryClient, 'exp-1', updatedExpense)

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(
          queryKeys.expenses(filters)
        )
        expect(cachedData?.data).toHaveLength(0)
      })

      it('adds expense to filtered cache when now matches', () => {
        const filters: ExpenseFilters = { category_id: 'cat-001' }
        queryClient.setQueryData(queryKeys.expenses(filters), { data: [] })

        // Also need unfiltered cache with the expense
        const expense = createMockExpense({ id: 'exp-1', category_id: 'cat-002' })
        queryClient.setQueryData(queryKeys.expenses(), { data: [expense] })

        const updatedExpense = createMockExpense({ id: 'exp-1', category_id: 'cat-001' })
        applyOptimisticExpenseUpdate(queryClient, 'exp-1', updatedExpense)

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(
          queryKeys.expenses(filters)
        )
        expect(cachedData?.data).toHaveLength(1)
      })
    })

    describe('applyOptimisticExpenseRemove', () => {
      it('removes expense from cache', () => {
        const expenses = [createMockExpense({ id: 'exp-1' }), createMockExpense({ id: 'exp-2' })]
        queryClient.setQueryData(queryKeys.expenses(), { data: expenses })

        applyOptimisticExpenseRemove(queryClient, 'exp-1')

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(cachedData!.data).toHaveLength(1)
        expect(cachedData!.data[0]!.id).toBe('exp-2')
      })

      it('preserves response format (wrapped)', () => {
        queryClient.setQueryData(queryKeys.expenses(), {
          data: [createMockExpense({ id: 'exp-1' })],
        })

        applyOptimisticExpenseRemove(queryClient, 'exp-1')

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(cachedData).toHaveProperty('data')
        expect(cachedData?.data).toHaveLength(0)
      })

      it('preserves response format (raw array)', () => {
        queryClient.setQueryData(queryKeys.expenses(), [createMockExpense({ id: 'exp-1' })])

        applyOptimisticExpenseRemove(queryClient, 'exp-1')

        const cachedData = queryClient.getQueryData<Expense[]>(queryKeys.expenses())
        expect(Array.isArray(cachedData)).toBe(true)
        expect(cachedData).toHaveLength(0)
      })
    })

    describe('applyOptimisticExpenseGroupRemove', () => {
      it('removes all expenses in installment group', () => {
        const expenses = [
          createMockExpense({ id: 'exp-1', installment_group_id: 'group-1' }),
          createMockExpense({ id: 'exp-2', installment_group_id: 'group-1' }),
          createMockExpense({ id: 'exp-3', installment_group_id: null }),
        ]
        queryClient.setQueryData(queryKeys.expenses(), { data: expenses })

        applyOptimisticExpenseGroupRemove(queryClient, 'group-1')

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(cachedData!.data).toHaveLength(1)
        expect(cachedData!.data[0]!.id).toBe('exp-3')
      })
    })

    describe('rollbackExpensesUpdate', () => {
      it('restores previous cache state', () => {
        const originalExpenses = [createMockExpense({ id: 'exp-1' })]
        queryClient.setQueryData(queryKeys.expenses(), { data: originalExpenses })

        const newExpense = createMockExpense({ id: 'exp-2' })
        const previousData = applyOptimisticExpenseAdd(queryClient, newExpense)

        // Verify add worked
        const afterAdd = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(afterAdd?.data).toHaveLength(2)

        // Rollback
        rollbackExpensesUpdate(queryClient, previousData)

        const afterRollback = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(afterRollback!.data).toHaveLength(1)
        expect(afterRollback!.data[0]!.id).toBe('exp-1')
      })
    })

    describe('addExpensesToCache', () => {
      it('adds single expense to cache', () => {
        queryClient.setQueryData(queryKeys.expenses(), { data: [] })

        const expense = createMockExpense({ id: 'exp-1' })
        addExpensesToCache(queryClient, expense)

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(cachedData?.data).toHaveLength(1)
      })

      it('adds multiple expenses to cache', () => {
        queryClient.setQueryData(queryKeys.expenses(), { data: [] })

        const expenses = [createMockExpense({ id: 'exp-1' }), createMockExpense({ id: 'exp-2' })]
        addExpensesToCache(queryClient, expenses)

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(cachedData?.data).toHaveLength(2)
      })

      it('does not add duplicates', () => {
        const existing = createMockExpense({ id: 'exp-1' })
        queryClient.setQueryData(queryKeys.expenses(), { data: [existing] })

        addExpensesToCache(queryClient, existing)

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(cachedData?.data).toHaveLength(1)
      })

      it('sorts expenses by date descending', () => {
        queryClient.setQueryData(queryKeys.expenses(), { data: [] })

        const expenses = [
          createMockExpense({ id: 'exp-1', date: '2026-01-10' }),
          createMockExpense({ id: 'exp-2', date: '2026-01-20' }),
        ]
        addExpensesToCache(queryClient, expenses)

        const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses())
        expect(cachedData!.data[0]!.id).toBe('exp-2')
        expect(cachedData!.data[1]!.id).toBe('exp-1')
      })
    })
  })

  describe('dashboard optimistic update integration', () => {
    let queryClient: QueryClient

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
    })

    afterEach(() => {
      queryClient.clear()
    })

    describe('applyOptimisticDashboardUpdate', () => {
      it('updates all dashboard queries in cache', () => {
        const dashboardData = createMockDashboardData()
        const queryKey = [
          'dashboard',
          { start_date: '2026-01-01', end_date: '2026-01-31', group_by: 'day' },
        ] as const
        queryClient.setQueryData(queryKey, dashboardData)

        const change = createExpenseChange({ amount_cents: 10000, operation: 'add' })
        applyOptimisticDashboardUpdate(queryClient, change)

        const cachedData = queryClient.getQueryData<DashboardData>(queryKey)
        expect(cachedData?.summary.total_expenses).toBe(210000)
      })

      it('returns previous data for rollback', () => {
        const dashboardData = createMockDashboardData()
        const queryKey = [
          'dashboard',
          { start_date: '2026-01-01', end_date: '2026-01-31', group_by: 'day' },
        ] as const
        queryClient.setQueryData(queryKey, dashboardData)

        const change = createExpenseChange()
        const previousData = applyOptimisticDashboardUpdate(queryClient, change)

        expect(previousData.size).toBeGreaterThan(0)
      })
    })

    describe('rollbackDashboardUpdate', () => {
      it('restores previous dashboard state', () => {
        const dashboardData = createMockDashboardData()
        const queryKey = [
          'dashboard',
          { start_date: '2026-01-01', end_date: '2026-01-31', group_by: 'day' },
        ] as const
        queryClient.setQueryData(queryKey, dashboardData)

        const change = createExpenseChange({ amount_cents: 50000, operation: 'add' })
        const previousData = applyOptimisticDashboardUpdate(queryClient, change)

        // Verify update worked
        const afterUpdate = queryClient.getQueryData<DashboardData>(queryKey)
        expect(afterUpdate?.summary.total_expenses).toBe(250000)

        // Rollback
        rollbackDashboardUpdate(queryClient, previousData)

        const afterRollback = queryClient.getQueryData<DashboardData>(queryKey)
        expect(afterRollback?.summary.total_expenses).toBe(200000)
      })
    })
  })

  describe('expense filter matching', () => {
    let queryClient: QueryClient

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
    })

    afterEach(() => {
      queryClient.clear()
    })

    it('matches expense within date range', () => {
      const filters: ExpenseFilters = {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      }
      queryClient.setQueryData(queryKeys.expenses(filters), { data: [] })

      const expense = createMockExpense({ date: '2026-01-15' })
      applyOptimisticExpenseAdd(queryClient, expense)

      const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses(filters))
      expect(cachedData?.data).toHaveLength(1)
    })

    it('excludes expense outside date range', () => {
      const filters: ExpenseFilters = {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      }
      queryClient.setQueryData(queryKeys.expenses(filters), { data: [] })

      const expense = createMockExpense({ date: '2026-02-15' })
      applyOptimisticExpenseAdd(queryClient, expense)

      const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses(filters))
      expect(cachedData?.data).toHaveLength(0)
    })

    it('matches expense by payment_method', () => {
      const filters: ExpenseFilters = { payment_method: 'pix' }
      queryClient.setQueryData(queryKeys.expenses(filters), { data: [] })

      const pixExpense = createMockExpense({ payment_method: 'pix' })
      const cardExpense = createMockExpense({ payment_method: 'credit_card' })

      applyOptimisticExpenseAdd(queryClient, pixExpense)
      applyOptimisticExpenseAdd(queryClient, cardExpense)

      const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses(filters))
      expect(cachedData!.data).toHaveLength(1)
      expect(cachedData!.data[0]!.payment_method).toBe('pix')
    })

    it('matches recurrent expense by expense_type', () => {
      const filters: ExpenseFilters = { expense_type: 'recurrent' }
      queryClient.setQueryData(queryKeys.expenses(filters), { data: [] })

      const recurrentExpense = createMockExpense({ is_recurrent: true })
      const oneTimeExpense = createMockExpense({ is_recurrent: false })

      applyOptimisticExpenseAdd(queryClient, recurrentExpense)
      applyOptimisticExpenseAdd(queryClient, oneTimeExpense)

      const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses(filters))
      expect(cachedData?.data).toHaveLength(1)
    })

    it('matches installment expense by expense_type', () => {
      const filters: ExpenseFilters = { expense_type: 'installment' }
      queryClient.setQueryData(queryKeys.expenses(filters), { data: [] })

      const installmentExpense = createMockExpense({ installment_total: 3, installment_current: 1 })
      const oneTimeExpense = createMockExpense({ installment_total: null })

      applyOptimisticExpenseAdd(queryClient, installmentExpense)
      applyOptimisticExpenseAdd(queryClient, oneTimeExpense)

      const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses(filters))
      expect(cachedData?.data).toHaveLength(1)
    })

    it('matches expense with credit_card_id filter', () => {
      const filters: ExpenseFilters = { credit_card_id: 'card-001' }
      queryClient.setQueryData(queryKeys.expenses(filters), { data: [] })

      const matchingExpense = createMockExpense({ credit_card_id: 'card-001' })
      const otherExpense = createMockExpense({ credit_card_id: 'card-002' })

      applyOptimisticExpenseAdd(queryClient, matchingExpense)
      applyOptimisticExpenseAdd(queryClient, otherExpense)

      const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses(filters))
      expect(cachedData?.data).toHaveLength(1)
    })

    it('matches expense with credit_card_id=none filter', () => {
      const filters: ExpenseFilters = { credit_card_id: 'none' }
      queryClient.setQueryData(queryKeys.expenses(filters), { data: [] })

      const noCreditCardExpense = createMockExpense({ credit_card_id: null })
      const withCreditCardExpense = createMockExpense({ credit_card_id: 'card-001' })

      applyOptimisticExpenseAdd(queryClient, noCreditCardExpense)
      applyOptimisticExpenseAdd(queryClient, withCreditCardExpense)

      const cachedData = queryClient.getQueryData<{ data: Expense[] }>(queryKeys.expenses(filters))
      expect(cachedData!.data).toHaveLength(1)
      expect(cachedData!.data[0]!.credit_card_id).toBeNull()
    })
  })
})
