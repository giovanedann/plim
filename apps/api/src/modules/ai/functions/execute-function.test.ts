import { createMockCategory, createMockCreditCard, createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateExpenseUseCase } from '../../expenses/create-expense.usecase'
import type { ExpensesRepository } from '../../expenses/expenses.repository'
import { type FunctionExecutionContext, executeFunction } from './execute-function'

function createMockSupabase(): {
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
} {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  }
}

function createMockCreateExpenseUseCase(): { execute: ReturnType<typeof vi.fn> } {
  return {
    execute: vi.fn(),
  }
}

function createMockExpensesRepository(): { findByUserId: ReturnType<typeof vi.fn> } {
  return {
    findByUserId: vi.fn(),
  }
}

describe('executeFunction', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let mockCreateExpenseUseCase: ReturnType<typeof createMockCreateExpenseUseCase>
  let mockExpensesRepository: ReturnType<typeof createMockExpensesRepository>
  let context: FunctionExecutionContext

  const userId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = createMockSupabase()
    mockCreateExpenseUseCase = createMockCreateExpenseUseCase()
    mockExpensesRepository = createMockExpensesRepository()

    context = {
      userId,
      supabase: mockSupabase as never,
      createExpenseUseCase: mockCreateExpenseUseCase as unknown as CreateExpenseUseCase,
      expensesRepository: mockExpensesRepository as unknown as ExpensesRepository,
    }
  })

  describe('create_expense', () => {
    it('creates one-time expense successfully', async () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Alimentação' })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: category, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }
      })

      const expense = createMockExpense({ id: 'exp-1', description: 'Almoço', amount_cents: 3500 })
      mockCreateExpenseUseCase.execute.mockResolvedValue(expense)

      const result = await executeFunction(
        {
          name: 'create_expense',
          args: {
            description: 'Almoço',
            amount_cents: 3500,
            category_name: 'Alimentação',
            payment_method: 'pix',
            date: '2026-01-15',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('expense_created')
      expect(result.message).toContain('Despesa criada')
      expect(result.message).toContain('Almoço')
      expect(result.message).toContain('R$')
    })

    it('creates installment expense with divided amount', async () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Eletrônicos' })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: category, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }
      })

      const expenses = [
        createMockExpense({ id: 'exp-1', installment_current: 1, installment_total: 3 }),
        createMockExpense({ id: 'exp-2', installment_current: 2, installment_total: 3 }),
        createMockExpense({ id: 'exp-3', installment_current: 3, installment_total: 3 }),
      ]
      mockCreateExpenseUseCase.execute.mockResolvedValue(expenses)

      const result = await executeFunction(
        {
          name: 'create_expense',
          args: {
            description: 'TV',
            amount_cents: 300000,
            category_name: 'Eletrônicos',
            payment_method: 'credit_card',
            date: '2026-01-15',
            installment_total: 3,
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('expense_created')
      expect(result.message).toContain('3x')
    })

    it('creates recurrent expense', async () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Assinaturas' })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: category, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }
      })

      const expense = createMockExpense({
        id: 'exp-1',
        is_recurrent: true,
        recurrence_day: 15,
      })
      mockCreateExpenseUseCase.execute.mockResolvedValue(expense)

      const result = await executeFunction(
        {
          name: 'create_expense',
          args: {
            description: 'Netflix',
            amount_cents: 5590,
            category_name: 'Assinaturas',
            payment_method: 'credit_card',
            date: '2026-01-15',
            is_recurrent: true,
            recurrence_day: 15,
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('expense_created')
      expect(result.message).toContain('recorrente')
      expect(result.message).toContain('dia 15')
    })

    it('resolves category by name', async () => {
      const category = createMockCategory({ id: 'cat-food', name: 'Alimentação' })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: category, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }
      })

      const expense = createMockExpense({ category_id: 'cat-food' })
      mockCreateExpenseUseCase.execute.mockResolvedValue(expense)

      await executeFunction(
        {
          name: 'create_expense',
          args: {
            description: 'Almoço',
            amount_cents: 3500,
            category_name: 'Alimentação',
            payment_method: 'pix',
            date: '2026-01-15',
          },
        },
        context
      )

      expect(mockCreateExpenseUseCase.execute).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          category_id: 'cat-food',
        })
      )
    })

    it('resolves credit card by name', async () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Compras' })
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank Roxo' })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: category, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'credit_card') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: creditCard, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const expense = createMockExpense({ credit_card_id: 'card-1' })
      mockCreateExpenseUseCase.execute.mockResolvedValue(expense)

      await executeFunction(
        {
          name: 'create_expense',
          args: {
            description: 'Compra online',
            amount_cents: 15000,
            category_name: 'Compras',
            payment_method: 'credit_card',
            date: '2026-01-15',
            credit_card_name: 'Nubank',
          },
        },
        context
      )

      expect(mockCreateExpenseUseCase.execute).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          credit_card_id: 'card-1',
        })
      )
    })

    it('returns error when category not found', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      }))

      const result = await executeFunction(
        {
          name: 'create_expense',
          args: {
            description: 'Test',
            amount_cents: 1000,
            category_name: 'NonExistent',
            payment_method: 'pix',
            date: '2026-01-15',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('categoria')
      expect(result.message).toContain('NonExistent')
    })

    it('returns error when credit card not found', async () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Compras' })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: category, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'credit_card') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const result = await executeFunction(
        {
          name: 'create_expense',
          args: {
            description: 'Test',
            amount_cents: 1000,
            category_name: 'Compras',
            payment_method: 'credit_card',
            date: '2026-01-15',
            credit_card_name: 'NonExistentCard',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('cartão')
      expect(result.message).toContain('NonExistentCard')
    })

    it('returns error when validation fails', async () => {
      const result = await executeFunction(
        {
          name: 'create_expense',
          args: {
            description: '',
            amount_cents: -100,
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
    })
  })

  describe('query_expenses', () => {
    it('queries expenses with filters', async () => {
      const expenses = [
        createMockExpense({ id: 'exp-1', amount_cents: 5000 }),
        createMockExpense({ id: 'exp-2', amount_cents: 3000 }),
      ]
      mockExpensesRepository.findByUserId.mockResolvedValue(expenses)

      const result = await executeFunction(
        {
          name: 'query_expenses',
          args: {
            start_date: '2026-01-01',
            end_date: '2026-01-31',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      expect(result.data).toMatchObject({
        total: 8000,
        count: 2,
      })
    })

    it('queries by category name', async () => {
      const category = createMockCategory({ id: 'cat-1', name: 'Alimentação' })
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'category') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: category, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const expenses = [createMockExpense({ category_id: 'cat-1', amount_cents: 5000 })]
      mockExpensesRepository.findByUserId.mockResolvedValue(expenses)

      const result = await executeFunction(
        {
          name: 'query_expenses',
          args: {
            category_name: 'Alimentação',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('Alimentação')
      expect(mockExpensesRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          category_id: 'cat-1',
        })
      )
    })

    it('limits results to 10 expenses', async () => {
      const expenses = Array.from({ length: 15 }, (_, i) =>
        createMockExpense({ id: `exp-${i}`, amount_cents: 1000 })
      )
      mockExpensesRepository.findByUserId.mockResolvedValue(expenses)

      const result = await executeFunction(
        {
          name: 'query_expenses',
          args: {},
        },
        context
      )

      expect(result.success).toBe(true)
      expect((result.data as { expenses: unknown[] }).expenses).toHaveLength(10)
    })

    it('handles empty results', async () => {
      mockExpensesRepository.findByUserId.mockResolvedValue([])

      const result = await executeFunction(
        {
          name: 'query_expenses',
          args: {
            start_date: '2026-01-01',
            end_date: '2026-01-31',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        total: 0,
        count: 0,
      })
    })

    it('queries expenses by credit card name', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank Ultravioleta' })
      const expenses = [
        createMockExpense({ id: 'exp-1', amount_cents: 5000, credit_card_id: 'card-1' }),
      ]
      mockExpensesRepository.findByUserId.mockResolvedValue(expenses)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'credit_card') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: creditCard, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      const result = await executeFunction(
        {
          name: 'query_expenses',
          args: {
            credit_card_name: 'Nubank Ultravioleta',
            start_date: '2026-01-01',
            end_date: '2026-01-31',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('Nubank Ultravioleta')
      expect(mockExpensesRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          credit_card_id: 'card-1',
        })
      )
    })

    it('includes materialized recurrent expenses in total', async () => {
      // With materialization, recurrent expenses are actual records returned by findByUserId
      const expenses = [
        createMockExpense({ id: 'exp-1', amount_cents: 5000, is_recurrent: false }),
        createMockExpense({
          id: 'exp-2',
          amount_cents: 3000,
          is_recurrent: true,
          recurrence_day: 15,
          recurrent_group_id: 'group-1',
        }),
      ]
      mockExpensesRepository.findByUserId.mockResolvedValue(expenses)

      const result = await executeFunction(
        {
          name: 'query_expenses',
          args: {
            start_date: '2026-01-01',
            end_date: '2026-01-31',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      // Should include one-time (5000) + materialized recurrent (3000)
      expect(result.data).toMatchObject({
        total: 8000,
        count: 2,
      })
    })
  })

  describe('forecast_spending', () => {
    it('forecasts spending for N months', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      mockExpensesRepository.findByUserId.mockResolvedValue([])

      const result = await executeFunction(
        {
          name: 'forecast_spending',
          args: {
            months_ahead: 3,
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('forecast_result')
      expect(result.message).toContain('Previsão de gastos')
      expect((result.data as { forecasts: unknown[] }).forecasts).toHaveLength(3)

      vi.useRealTimers()
    })

    it('includes materialized recurrent expenses in forecast', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      // With materialization, recurrent expenses are actual records returned by findByUserId
      const recurrentExpense = createMockExpense({
        id: 'rec-1',
        amount_cents: 5000,
        is_recurrent: true,
        recurrence_day: 15,
        recurrent_group_id: 'group-1',
        date: '2026-01-15',
      })
      mockExpensesRepository.findByUserId.mockResolvedValue([recurrentExpense])

      const result = await executeFunction(
        {
          name: 'forecast_spending',
          args: {
            months_ahead: 2,
            include_recurrent: true,
          },
        },
        context
      )

      expect(result.success).toBe(true)
      const forecasts = (result.data as { forecasts: Array<{ breakdown: { recurrent: number } }> })
        .forecasts
      expect(forecasts[0]!.breakdown.recurrent).toBe(5000)

      vi.useRealTimers()
    })

    it('defaults to 3 months ahead', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

      mockExpensesRepository.findByUserId.mockResolvedValue([])

      const result = await executeFunction(
        {
          name: 'forecast_spending',
          args: {},
        },
        context
      )

      expect(result.success).toBe(true)
      expect((result.data as { forecasts: unknown[] }).forecasts).toHaveLength(3)

      vi.useRealTimers()
    })
  })

  describe('unknown function', () => {
    it('returns error for unknown function name', async () => {
      const result = await executeFunction(
        {
          name: 'unknown_function',
          args: {},
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('unknown_function')
    })
  })

  describe('execute_query', () => {
    it('routes to execute_query function for SQL queries', async () => {
      const expenses = [{ categoria: 'Alimentação', total: 8000 }]

      mockSupabase.rpc.mockResolvedValue({ data: expenses, error: null })

      const result = await executeFunction(
        {
          name: 'execute_query',
          args: {
            sql: "SELECT c.name as categoria, SUM(e.amount_cents) as total FROM expense e JOIN category c ON e.category_id = c.id WHERE e.user_id = '{userId}' GROUP BY c.name",
            description: 'expenses_by_category',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('execute_readonly_sql', {
        query_text: expect.stringContaining(userId),
      })
    })

    it('returns query result for listing credit cards', async () => {
      const creditCards = [
        { name: 'Nubank', flag: 'mastercard', bank: 'Nubank' },
        { name: 'Itaú', flag: 'visa', bank: 'Itaú' },
      ]

      mockSupabase.rpc.mockResolvedValue({ data: creditCards, error: null })

      const result = await executeFunction(
        {
          name: 'execute_query',
          args: {
            sql: "SELECT name, flag, bank FROM credit_card WHERE user_id = '{userId}' AND is_active = true",
            description: 'list_credit_cards',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      // Raw data is returned for AI formatting
      const resultData = result.data as { rows: typeof creditCards; count: number }
      expect(resultData.rows).toEqual(creditCards)
      expect(resultData.count).toBe(2)
    })

    it('returns error for missing user_id filter', async () => {
      const result = await executeFunction(
        {
          name: 'execute_query',
          args: {
            sql: 'SELECT * FROM expense',
            description: 'all_expenses',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('user_id')
    })
  })
})
