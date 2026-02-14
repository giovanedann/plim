import type { DashboardData } from '@plim/shared'
import { describe, expect, it } from 'vitest'
import { filterEmptyPeriods } from './filter-empty-periods'

function createBaseDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    summary: {
      total_income: 500000,
      total_expenses: 350000,
      balance: 150000,
      savings_rate: 30,
      comparison: {
        income_change_percent: 5,
        expenses_change_percent: -2,
        balance_change_percent: 15,
      },
    },
    expensesTimeline: {
      data: [],
      group_by: 'month',
    },
    incomeVsExpenses: { data: [] },
    categoryBreakdown: { data: [], total: 0 },
    paymentBreakdown: { data: [], total: 0 },
    creditCardBreakdown: { data: [], total: 0 },
    savingsRate: { data: [] },
    salaryTimeline: { data: [] },
    installmentForecast: { data: [] },
    ...overrides,
  }
}

describe('filterEmptyPeriods', () => {
  const sut = filterEmptyPeriods

  describe('expensesTimeline', () => {
    it('removes data points with zero amount', () => {
      const data = createBaseDashboardData({
        expensesTimeline: {
          data: [
            { date: '2026-01', amount: 10000 },
            { date: '2026-02', amount: 0 },
            { date: '2026-03', amount: 5000 },
          ],
          group_by: 'month',
        },
      })

      const result = sut(data)

      expect(result.expensesTimeline.data).toHaveLength(2)
      expect(result.expensesTimeline.data[0]!.date).toBe('2026-01')
      expect(result.expensesTimeline.data[1]!.date).toBe('2026-03')
    })

    it('preserves group_by field', () => {
      const data = createBaseDashboardData({
        expensesTimeline: {
          data: [{ date: '2026-01', amount: 0 }],
          group_by: 'week',
        },
      })

      const result = sut(data)

      expect(result.expensesTimeline.group_by).toBe('week')
    })

    it('returns empty array when all periods are empty', () => {
      const data = createBaseDashboardData({
        expensesTimeline: {
          data: [
            { date: '2026-01', amount: 0 },
            { date: '2026-02', amount: 0 },
          ],
          group_by: 'month',
        },
      })

      const result = sut(data)

      expect(result.expensesTimeline.data).toHaveLength(0)
    })
  })

  describe('incomeVsExpenses', () => {
    it('removes months where both income and expenses are zero', () => {
      const data = createBaseDashboardData({
        incomeVsExpenses: {
          data: [
            { month: '2026-01', income: 500000, expenses: 300000 },
            { month: '2026-02', income: 0, expenses: 0 },
            { month: '2026-03', income: 0, expenses: 15000 },
          ],
        },
      })

      const result = sut(data)

      expect(result.incomeVsExpenses!.data).toHaveLength(2)
      expect(result.incomeVsExpenses!.data[0]!.month).toBe('2026-01')
      expect(result.incomeVsExpenses!.data[1]!.month).toBe('2026-03')
    })

    it('keeps months with only income', () => {
      const data = createBaseDashboardData({
        incomeVsExpenses: {
          data: [{ month: '2026-01', income: 500000, expenses: 0 }],
        },
      })

      const result = sut(data)

      expect(result.incomeVsExpenses!.data).toHaveLength(1)
    })

    it('returns null when input is null', () => {
      const data = createBaseDashboardData({ incomeVsExpenses: null })

      const result = sut(data)

      expect(result.incomeVsExpenses).toBeNull()
    })
  })

  describe('savingsRate', () => {
    it('removes months with zero rate', () => {
      const data = createBaseDashboardData({
        savingsRate: {
          data: [
            { month: '2026-01', rate: 30 },
            { month: '2026-02', rate: 0 },
            { month: '2026-03', rate: -10 },
          ],
        },
      })

      const result = sut(data)

      expect(result.savingsRate!.data).toHaveLength(2)
      expect(result.savingsRate!.data[0]!.month).toBe('2026-01')
      expect(result.savingsRate!.data[1]!.month).toBe('2026-03')
    })

    it('keeps months with negative rate', () => {
      const data = createBaseDashboardData({
        savingsRate: {
          data: [{ month: '2026-01', rate: -15.5 }],
        },
      })

      const result = sut(data)

      expect(result.savingsRate!.data).toHaveLength(1)
    })

    it('returns null when input is null', () => {
      const data = createBaseDashboardData({ savingsRate: null })

      const result = sut(data)

      expect(result.savingsRate).toBeNull()
    })
  })

  describe('salaryTimeline', () => {
    it('removes data points with zero amount', () => {
      const data = createBaseDashboardData({
        salaryTimeline: {
          data: [
            { date: '2026-01-01', amount: 500000 },
            { date: '2026-02-01', amount: 0 },
            { date: '2026-03-01', amount: 550000 },
          ],
        },
      })

      const result = sut(data)

      expect(result.salaryTimeline!.data).toHaveLength(2)
      expect(result.salaryTimeline!.data[0]!.date).toBe('2026-01-01')
      expect(result.salaryTimeline!.data[1]!.date).toBe('2026-03-01')
    })

    it('returns null when input is null', () => {
      const data = createBaseDashboardData({ salaryTimeline: null })

      const result = sut(data)

      expect(result.salaryTimeline).toBeNull()
    })
  })

  describe('installmentForecast', () => {
    it('removes months with zero total', () => {
      const data = createBaseDashboardData({
        installmentForecast: {
          data: [
            { month: '2026-02', total: 50000 },
            { month: '2026-03', total: 0 },
            { month: '2026-04', total: 30000 },
          ],
        },
      })

      const result = sut(data)

      expect(result.installmentForecast!.data).toHaveLength(2)
      expect(result.installmentForecast!.data[0]!.month).toBe('2026-02')
      expect(result.installmentForecast!.data[1]!.month).toBe('2026-04')
    })

    it('returns null when input is null', () => {
      const data = createBaseDashboardData({ installmentForecast: null })

      const result = sut(data)

      expect(result.installmentForecast).toBeNull()
    })
  })

  describe('passthrough fields', () => {
    it('does not modify summary', () => {
      const summary = {
        total_income: 500000,
        total_expenses: 350000,
        balance: 150000,
        savings_rate: 30,
        comparison: {
          income_change_percent: 5,
          expenses_change_percent: -2,
          balance_change_percent: 15,
        },
      }
      const data = createBaseDashboardData({ summary })

      const result = sut(data)

      expect(result.summary).toEqual(summary)
    })

    it('does not modify categoryBreakdown', () => {
      const categoryBreakdown = {
        data: [
          {
            category_id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Food',
            color: '#FF0000',
            icon: 'utensils',
            amount: 150000,
            percentage: 42.86,
          },
        ],
        total: 150000,
      }
      const data = createBaseDashboardData({ categoryBreakdown })

      const result = sut(data)

      expect(result.categoryBreakdown).toEqual(categoryBreakdown)
    })

    it('does not modify paymentBreakdown', () => {
      const paymentBreakdown = {
        data: [{ method: 'pix', amount: 200000, percentage: 57.14 }],
        total: 200000,
      }
      const data = createBaseDashboardData({ paymentBreakdown })

      const result = sut(data)

      expect(result.paymentBreakdown).toEqual(paymentBreakdown)
    })
  })

  describe('annual view with sparse data', () => {
    it('filters all timeline datasets consistently', () => {
      const data = createBaseDashboardData({
        expensesTimeline: {
          data: [
            { date: '2026-01', amount: 10000 },
            { date: '2026-02', amount: 20000 },
            { date: '2026-03', amount: 0 },
            { date: '2026-04', amount: 0 },
            { date: '2026-05', amount: 5000 },
            { date: '2026-06', amount: 0 },
            { date: '2026-07', amount: 0 },
            { date: '2026-08', amount: 0 },
            { date: '2026-09', amount: 0 },
            { date: '2026-10', amount: 0 },
            { date: '2026-11', amount: 0 },
            { date: '2026-12', amount: 0 },
          ],
          group_by: 'month',
        },
        incomeVsExpenses: {
          data: [
            { month: '2026-01', income: 500000, expenses: 10000 },
            { month: '2026-02', income: 500000, expenses: 20000 },
            { month: '2026-03', income: 0, expenses: 0 },
            { month: '2026-04', income: 0, expenses: 0 },
            { month: '2026-05', income: 500000, expenses: 5000 },
            { month: '2026-06', income: 0, expenses: 0 },
            { month: '2026-07', income: 0, expenses: 0 },
            { month: '2026-08', income: 0, expenses: 0 },
            { month: '2026-09', income: 0, expenses: 0 },
            { month: '2026-10', income: 0, expenses: 0 },
            { month: '2026-11', income: 0, expenses: 0 },
            { month: '2026-12', income: 0, expenses: 0 },
          ],
        },
        savingsRate: {
          data: [
            { month: '2026-01', rate: 98 },
            { month: '2026-02', rate: 96 },
            { month: '2026-03', rate: 0 },
            { month: '2026-04', rate: 0 },
            { month: '2026-05', rate: 99 },
            { month: '2026-06', rate: 0 },
            { month: '2026-07', rate: 0 },
            { month: '2026-08', rate: 0 },
            { month: '2026-09', rate: 0 },
            { month: '2026-10', rate: 0 },
            { month: '2026-11', rate: 0 },
            { month: '2026-12', rate: 0 },
          ],
        },
        installmentForecast: {
          data: [
            { month: '2026-02', total: 50000 },
            { month: '2026-03', total: 50000 },
            { month: '2026-04', total: 0 },
            { month: '2026-05', total: 0 },
          ],
        },
      })

      const result = sut(data)

      expect(result.expensesTimeline.data).toHaveLength(3)
      expect(result.incomeVsExpenses!.data).toHaveLength(3)
      expect(result.savingsRate!.data).toHaveLength(3)
      expect(result.installmentForecast!.data).toHaveLength(2)
    })
  })
})
