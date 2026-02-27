import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCreateExpenseTool } from './create-expense.tool'
import type { ActionResult, ToolContext } from './types'

function createCategorySupabaseMock(result: {
  data: unknown
  error: unknown
}): ToolContext['supabase'] {
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
    supabase: createCategorySupabaseMock({ data: null, error: { message: 'not found' } }),
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

describe('createCreateExpenseTool', () => {
  let ctx: ToolContext

  beforeEach(() => {
    ctx = createMockContext()
  })

  it('creates a one-time expense successfully', async () => {
    ctx.supabase = createCategorySupabaseMock({
      data: { id: 'cat-1', name: 'Food' },
      error: null,
    })
    const expense = {
      id: 'exp-1',
      description: 'Lunch',
      amount_cents: 3500,
      type: 'one_time',
    }
    vi.mocked(ctx.createExpenseUseCase.execute).mockResolvedValue(expense as never)

    const tool = createCreateExpenseTool(ctx)
    const result = (await tool.execute!(
      {
        description: 'Lunch',
        amount_cents: 3500,
        category_name: 'Food',
        payment_method: 'pix',
        date: '2026-02-15',
        transaction_type: 'expense',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('expense_created')
    expect(result.message).toContain('Lunch')
    expect(result.message).toContain('35,00')
    expect(ctx.createExpenseUseCase.execute).toHaveBeenCalledWith('test-user-id', {
      type: 'one_time',
      category_id: 'cat-1',
      description: 'Lunch',
      amount_cents: 3500,
      payment_method: 'pix',
      date: '2026-02-15',
      credit_card_id: undefined,
    })
  })

  it('creates an income transaction successfully', async () => {
    const income = {
      id: 'inc-1',
      description: 'Freelance',
      amount_cents: 200000,
      type: 'income',
    }
    vi.mocked(ctx.createExpenseUseCase.execute).mockResolvedValue(income as never)

    const tool = createCreateExpenseTool(ctx)
    const result = (await tool.execute!(
      {
        description: 'Freelance',
        amount_cents: 200000,
        payment_method: 'pix',
        date: '2026-02-01',
        transaction_type: 'income',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('expense_created')
    expect(result.message).toContain('Receita registrada')
    expect(result.message).toContain('Freelance')
    expect(result.message).toContain('2.000,00')
    expect(ctx.createExpenseUseCase.execute).toHaveBeenCalledWith('test-user-id', {
      type: 'income',
      description: 'Freelance',
      amount_cents: 200000,
      date: '2026-02-01',
      payment_method: 'pix',
    })
  })

  it('creates an installment expense with installment info in message', async () => {
    ctx.supabase = createCategorySupabaseMock({
      data: { id: 'cat-1', name: 'Electronics' },
      error: null,
    })
    const expenses = [
      { id: 'exp-1', description: 'Laptop', installment_current: 1 },
      { id: 'exp-2', description: 'Laptop', installment_current: 2 },
      { id: 'exp-3', description: 'Laptop', installment_current: 3 },
    ]
    vi.mocked(ctx.createExpenseUseCase.execute).mockResolvedValue(expenses as never)

    const tool = createCreateExpenseTool(ctx)
    const result = (await tool.execute!(
      {
        description: 'Laptop',
        amount_cents: 300000,
        category_name: 'Electronics',
        payment_method: 'credit_card',
        date: '2026-02-15',
        installment_total: 3,
        transaction_type: 'expense',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('expense_created')
    expect(result.message).toContain('3x')
    expect(result.message).toContain('3.000,00')
    expect(result.message).toContain('1.000,00')
  })

  it('creates a recurrent expense with day info in message', async () => {
    ctx.supabase = createCategorySupabaseMock({
      data: { id: 'cat-1', name: 'Streaming' },
      error: null,
    })
    const expense = { id: 'exp-1', description: 'Netflix', is_recurrent: true }
    vi.mocked(ctx.createExpenseUseCase.execute).mockResolvedValue(expense as never)

    const tool = createCreateExpenseTool(ctx)
    const result = (await tool.execute!(
      {
        description: 'Netflix',
        amount_cents: 5590,
        category_name: 'Streaming',
        payment_method: 'credit_card',
        date: '2026-02-10',
        is_recurrent: true,
        recurrence_day: 10,
        transaction_type: 'expense',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('expense_created')
    expect(result.message).toContain('recorrente')
    expect(result.message).toContain('dia 10')
    expect(ctx.createExpenseUseCase.execute).toHaveBeenCalledWith('test-user-id', {
      type: 'recurrent',
      category_id: 'cat-1',
      description: 'Netflix',
      amount_cents: 5590,
      payment_method: 'credit_card',
      recurrence_day: 10,
      recurrence_start: '2026-02-10',
      credit_card_id: undefined,
    })
  })

  it('returns error when category is not found', async () => {
    const tool = createCreateExpenseTool(ctx)
    const result = (await tool.execute!(
      {
        description: 'Lunch',
        amount_cents: 3500,
        category_name: 'NonExistent',
        payment_method: 'pix',
        date: '2026-02-15',
        transaction_type: 'expense',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('NonExistent')
  })

  it('returns error when category is missing for non-income expense', async () => {
    const tool = createCreateExpenseTool(ctx)
    const result = (await tool.execute!(
      {
        description: 'Lunch',
        amount_cents: 3500,
        payment_method: 'pix',
        date: '2026-02-15',
        transaction_type: 'expense',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('Categoria é obrigatória')
  })

  it('returns error when usecase throws', async () => {
    ctx.supabase = createCategorySupabaseMock({
      data: { id: 'cat-1', name: 'Food' },
      error: null,
    })
    vi.mocked(ctx.createExpenseUseCase.execute).mockRejectedValue(new Error('DB error'))

    const tool = createCreateExpenseTool(ctx)
    const result = (await tool.execute!(
      {
        description: 'Lunch',
        amount_cents: 3500,
        category_name: 'Food',
        payment_method: 'pix',
        date: '2026-02-15',
        transaction_type: 'expense',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('despesa')
  })
})
