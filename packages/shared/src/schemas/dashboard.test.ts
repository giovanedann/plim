import { describe, expect, it } from 'vitest'
import {
  categoryBreakdownResponseSchema,
  creditCardBreakdownResponseSchema,
  dashboardQuerySchema,
  dashboardSummarySchema,
  expensesTimelineQuerySchema,
  expensesTimelineResponseSchema,
  incomeVsExpensesResponseSchema,
  installmentForecastResponseSchema,
  paymentBreakdownResponseSchema,
  salaryTimelineResponseSchema,
  savingsRateResponseSchema,
  timelineGroupBySchema,
} from './dashboard'

describe('timelineGroupBySchema', () => {
  const sut = timelineGroupBySchema

  it.each(['day', 'week', 'month'] as const)('accepts valid group_by: %s', (groupBy) => {
    const result = sut.safeParse(groupBy)

    expect(result.success).toBe(true)
  })

  it('rejects invalid group_by', () => {
    const result = sut.safeParse('year')

    expect(result.success).toBe(false)
  })
})

describe('dashboardQuerySchema', () => {
  const sut = dashboardQuerySchema

  it('accepts valid query with date range', () => {
    const query = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    }

    const result = sut.safeParse(query)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(query)
  })

  it('accepts query with optional group_by', () => {
    const query = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'week' as const,
    }

    const result = sut.safeParse(query)

    expect(result.success).toBe(true)
    expect(result.data?.group_by).toBe('week')
  })

  it('rejects query without start_date', () => {
    const query = { end_date: '2024-01-31' }

    const result = sut.safeParse(query)

    expect(result.success).toBe(false)
  })

  it('rejects query without end_date', () => {
    const query = { start_date: '2024-01-01' }

    const result = sut.safeParse(query)

    expect(result.success).toBe(false)
  })

  it('rejects query with invalid date format', () => {
    const query = {
      start_date: '01-01-2024',
      end_date: '2024-01-31',
    }

    const result = sut.safeParse(query)

    expect(result.success).toBe(false)
  })
})

describe('expensesTimelineQuerySchema', () => {
  const sut = expensesTimelineQuerySchema

  it('applies default group_by when not provided', () => {
    const query = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    }

    const result = sut.safeParse(query)

    expect(result.success).toBe(true)
    expect(result.data?.group_by).toBe('day')
  })

  it('accepts custom group_by', () => {
    const query = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      group_by: 'month' as const,
    }

    const result = sut.safeParse(query)

    expect(result.success).toBe(true)
    expect(result.data?.group_by).toBe('month')
  })
})

describe('dashboardSummarySchema', () => {
  const sut = dashboardSummarySchema

  const validSummary = {
    total_income: 500000,
    total_expenses: 300000,
    balance: 200000,
    savings_rate: 40.0,
    comparison: {
      income_change_percent: 5.5,
      expenses_change_percent: -2.3,
      balance_change_percent: 15.0,
    },
  }

  it('accepts valid summary', () => {
    const result = sut.safeParse(validSummary)

    expect(result.success).toBe(true)
    expect(result.data).toEqual(validSummary)
  })

  it('accepts zero values', () => {
    const summary = {
      ...validSummary,
      total_income: 0,
      total_expenses: 0,
      balance: 0,
    }

    const result = sut.safeParse(summary)

    expect(result.success).toBe(true)
  })

  it('accepts negative balance', () => {
    const summary = { ...validSummary, balance: -50000 }

    const result = sut.safeParse(summary)

    expect(result.success).toBe(true)
  })

  it('rejects negative total_income', () => {
    const summary = { ...validSummary, total_income: -1000 }

    const result = sut.safeParse(summary)

    expect(result.success).toBe(false)
  })

  it('rejects negative total_expenses', () => {
    const summary = { ...validSummary, total_expenses: -1000 }

    const result = sut.safeParse(summary)

    expect(result.success).toBe(false)
  })
})

describe('expensesTimelineResponseSchema', () => {
  const sut = expensesTimelineResponseSchema

  it('accepts valid response', () => {
    const response = {
      data: [
        { date: '2024-01-01', amount: 10000 },
        { date: '2024-01-02', amount: 15000 },
      ],
      group_by: 'day' as const,
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })

  it('accepts empty data array', () => {
    const response = {
      data: [],
      group_by: 'month' as const,
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })

  it('rejects data point with negative amount', () => {
    const response = {
      data: [{ date: '2024-01-01', amount: -100 }],
      group_by: 'day' as const,
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(false)
  })
})

describe('incomeVsExpensesResponseSchema', () => {
  const sut = incomeVsExpensesResponseSchema

  it('accepts valid response', () => {
    const response = {
      data: [
        { month: '2024-01', income: 500000, expenses: 300000 },
        { month: '2024-02', income: 520000, expenses: 280000 },
      ],
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })

  it('accepts empty data array', () => {
    const result = sut.safeParse({ data: [] })

    expect(result.success).toBe(true)
  })
})

describe('categoryBreakdownResponseSchema', () => {
  const sut = categoryBreakdownResponseSchema

  it('accepts valid response', () => {
    const response = {
      data: [
        {
          category_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Groceries',
          color: '#FF5733',
          icon: '🛒',
          amount: 50000,
          percentage: 25.5,
        },
      ],
      total: 196078,
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })

  it('accepts null color and icon', () => {
    const response = {
      data: [
        {
          category_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Other',
          color: null,
          icon: null,
          amount: 10000,
          percentage: 5.0,
        },
      ],
      total: 200000,
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })
})

describe('paymentBreakdownResponseSchema', () => {
  const sut = paymentBreakdownResponseSchema

  it('accepts valid response', () => {
    const response = {
      data: [
        { method: 'credit_card', amount: 150000, percentage: 50.0 },
        { method: 'pix', amount: 100000, percentage: 33.3 },
        { method: 'cash', amount: 50000, percentage: 16.7 },
      ],
      total: 300000,
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })
})

describe('savingsRateResponseSchema', () => {
  const sut = savingsRateResponseSchema

  it('accepts valid response', () => {
    const response = {
      data: [
        { month: '2024-01', rate: 35.5 },
        { month: '2024-02', rate: 42.0 },
      ],
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })

  it('accepts negative rate', () => {
    const response = {
      data: [{ month: '2024-01', rate: -15.0 }],
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })
})

describe('salaryTimelineResponseSchema', () => {
  const sut = salaryTimelineResponseSchema

  it('accepts valid response', () => {
    const response = {
      data: [
        { date: '2024-01-01', amount: 500000 },
        { date: '2024-02-01', amount: 520000 },
      ],
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })
})

describe('installmentForecastResponseSchema', () => {
  const sut = installmentForecastResponseSchema

  it('accepts valid response', () => {
    const response = {
      data: [
        { month: '2024-02', total: 50000 },
        { month: '2024-03', total: 50000 },
        { month: '2024-04', total: 25000 },
      ],
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })

  it('accepts empty forecast', () => {
    const result = sut.safeParse({ data: [] })

    expect(result.success).toBe(true)
  })
})

describe('creditCardBreakdownResponseSchema', () => {
  const sut = creditCardBreakdownResponseSchema

  it('accepts valid response', () => {
    const response = {
      data: [
        {
          credit_card_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Nubank',
          color: 'dark_blue',
          bank: 'nubank',
          flag: 'mastercard',
          amount: 100000,
          percentage: 66.7,
        },
      ],
      total: 150000,
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })

  it('accepts null credit_card_id for non-card expenses', () => {
    const response = {
      data: [
        {
          credit_card_id: null,
          name: 'Other',
          color: 'gray',
          bank: 'other',
          flag: 'other',
          amount: 50000,
          percentage: 33.3,
        },
      ],
      total: 150000,
    }

    const result = sut.safeParse(response)

    expect(result.success).toBe(true)
  })
})
