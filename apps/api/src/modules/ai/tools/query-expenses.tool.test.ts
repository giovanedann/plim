import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryExpensesTool } from './query-expenses.tool'
import type { ActionResult, ToolContext } from './types'

function createSupabaseMock(result: { data: unknown; error: unknown }): ToolContext['supabase'] {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(result),
              }),
            }),
          }),
        }),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(result),
              }),
            }),
          }),
        }),
      }),
    }),
  } as unknown as ToolContext['supabase']
}

function createMockContext(overrides?: Partial<ToolContext>): ToolContext {
  return {
    userId: 'test-user-id',
    supabase: createSupabaseMock({ data: null, error: { message: 'not found' } }),
    createExpenseUseCase: { execute: vi.fn() } as unknown as ToolContext['createExpenseUseCase'],
    createSalaryUseCase: { execute: vi.fn() } as unknown as ToolContext['createSalaryUseCase'],
    expensesRepository: { findByUserId: vi.fn() } as unknown as ToolContext['expensesRepository'],
    updateCreditCardUseCase: {
      execute: vi.fn(),
    } as unknown as ToolContext['updateCreditCardUseCase'],
    getOrCreateInvoiceUseCase: {
      execute: vi.fn(),
    } as unknown as ToolContext['getOrCreateInvoiceUseCase'],
    getCreditCardLimitUsageUseCase: {
      execute: vi.fn(),
    } as unknown as ToolContext['getCreditCardLimitUsageUseCase'],
    payInvoiceUseCase: { execute: vi.fn() } as unknown as ToolContext['payInvoiceUseCase'],
    invoicesRepository: {
      findUnpaidByCard: vi.fn(),
    } as unknown as ToolContext['invoicesRepository'],
    creditCardsRepository: {
      findByUserId: vi.fn(),
    } as unknown as ToolContext['creditCardsRepository'],
    ...overrides,
  }
}

const toolCallOpts = { toolCallId: '', messages: [] }

describe('createQueryExpensesTool', () => {
  let ctx: ToolContext

  beforeEach(() => {
    ctx = createMockContext()
  })

  it('returns expenses with date range filter', async () => {
    const expenses = [
      {
        id: 'e1',
        description: 'Lunch',
        amount_cents: 3500,
        payment_method: 'pix',
        date: '2026-02-15',
        category_id: 'cat-1',
      },
      {
        id: 'e2',
        description: 'Dinner',
        amount_cents: 5000,
        payment_method: 'pix',
        date: '2026-02-16',
        category_id: 'cat-1',
      },
    ]
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue(expenses as never)

    const tool = createQueryExpensesTool(ctx)
    const result = (await tool.execute!(
      { start_date: '2026-02-01', end_date: '2026-02-28' },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('query_result')
    expect(result.message).toContain('85,00')
    expect(result.message).toContain('2 despesas')
    const data = result.data as { total: number; count: number }
    expect(data.total).toBe(8500)
    expect(data.count).toBe(2)
  })

  it('returns expenses with category filter', async () => {
    ctx.supabase = createSupabaseMock({
      data: { id: 'cat-1', name: 'Food' },
      error: null,
    })
    const expenses = [
      {
        id: 'e1',
        description: 'Lunch',
        amount_cents: 3500,
        payment_method: 'pix',
        date: '2026-02-15',
        category_id: 'cat-1',
      },
    ]
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue(expenses as never)

    const tool = createQueryExpensesTool(ctx)
    const result = (await tool.execute!({ category_name: 'Food' }, toolCallOpts)) as ActionResult

    expect(result.success).toBe(true)
    expect(result.message).toContain('Food')
    expect(ctx.expensesRepository.findByUserId).toHaveBeenCalledWith('test-user-id', {
      start_date: undefined,
      end_date: undefined,
      category_id: 'cat-1',
      payment_method: undefined,
      credit_card_id: undefined,
    })
  })

  it('returns grouped data when group_by is specified', async () => {
    const expenses = [
      {
        id: 'e1',
        description: 'Lunch',
        amount_cents: 3500,
        payment_method: 'pix',
        date: '2026-02-15',
        category_id: 'cat-1',
      },
      {
        id: 'e2',
        description: 'Coffee',
        amount_cents: 1500,
        payment_method: 'pix',
        date: '2026-02-15',
        category_id: 'cat-1',
      },
      {
        id: 'e3',
        description: 'Uber',
        amount_cents: 2000,
        payment_method: 'pix',
        date: '2026-02-15',
        category_id: 'cat-2',
      },
    ]
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue(expenses as never)

    const tool = createQueryExpensesTool(ctx)
    const result = (await tool.execute!({ group_by: 'category' }, toolCallOpts)) as ActionResult

    expect(result.success).toBe(true)
    const data = result.data as {
      grouped: Record<string, { total: number; count: number }>
    }
    expect(data.grouped).toBeDefined()
    expect(data.grouped!['cat-1']).toEqual({ total: 5000, count: 2 })
    expect(data.grouped!['cat-2']).toEqual({ total: 2000, count: 1 })
  })

  it('returns success with 0 count for empty results', async () => {
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue([])

    const tool = createQueryExpensesTool(ctx)
    const result = (await tool.execute!({}, toolCallOpts)) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('query_result')
    expect(result.message).toContain('0 despesas')
    const data = result.data as { total: number; count: number }
    expect(data.total).toBe(0)
    expect(data.count).toBe(0)
  })

  it('includes payment method name in message when filtered by payment_method', async () => {
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue([])

    const tool = createQueryExpensesTool(ctx)
    const result = (await tool.execute!({ payment_method: 'pix' }, toolCallOpts)) as ActionResult

    expect(result.success).toBe(true)
    expect(result.message).toContain('Pix')
  })

  it('limits returned expenses to 10 in the data', async () => {
    const expenses = Array.from({ length: 15 }, (_, i) => ({
      id: `e${i}`,
      description: `Expense ${i}`,
      amount_cents: 1000,
      payment_method: 'pix',
      date: '2026-02-15',
      category_id: 'cat-1',
    }))
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue(expenses as never)

    const tool = createQueryExpensesTool(ctx)
    const result = (await tool.execute!({}, toolCallOpts)) as ActionResult

    expect(result.success).toBe(true)
    const data = result.data as { expenses: unknown[]; count: number }
    expect(data.expenses).toHaveLength(10)
    expect(data.count).toBe(15)
  })
})
