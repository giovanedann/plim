import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPayInvoiceTool } from './pay-invoice.tool'
import type { ActionResult, ToolContext } from './types'

function createCreditCardSupabaseMock(result: {
  data: unknown
  error: unknown
}): ToolContext['supabase'] {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
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
    supabase: createCreditCardSupabaseMock({ data: null, error: { message: 'not found' } }),
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

describe('createPayInvoiceTool', () => {
  let ctx: ToolContext

  beforeEach(() => {
    ctx = createMockContext()
  })

  it('pays invoice in full when pay_full is true', async () => {
    ctx.supabase = createCreditCardSupabaseMock({
      data: { id: 'card-1', name: 'Nubank' },
      error: null,
    })

    const invoice = {
      id: 'inv-1',
      total_amount_cents: 50000,
      carry_over_cents: 0,
      paid_amount_cents: 0,
      status: 'open',
    }
    vi.mocked(ctx.getOrCreateInvoiceUseCase.execute).mockResolvedValue({
      invoice,
      transactions: [],
    } as never)
    vi.mocked(ctx.payInvoiceUseCase.execute).mockResolvedValue({
      ...invoice,
      paid_amount_cents: 50000,
      status: 'paid',
    } as never)

    const tool = createPayInvoiceTool(ctx)
    const result = (await tool.execute!(
      {
        credit_card_name: 'Nubank',
        reference_month: '2026-02',
        pay_full: true,
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('invoice_paid')
    expect(result.message).toContain('paga integralmente')
    expect(result.message).toContain('500,00')
    expect(ctx.payInvoiceUseCase.execute).toHaveBeenCalledWith('test-user-id', 'inv-1', 50000)
  })

  it('registers partial payment with remaining amount', async () => {
    ctx.supabase = createCreditCardSupabaseMock({
      data: { id: 'card-1', name: 'Nubank' },
      error: null,
    })

    const invoice = {
      id: 'inv-1',
      total_amount_cents: 50000,
      carry_over_cents: 0,
      paid_amount_cents: 0,
      status: 'open',
    }
    vi.mocked(ctx.getOrCreateInvoiceUseCase.execute).mockResolvedValue({
      invoice,
      transactions: [],
    } as never)
    vi.mocked(ctx.payInvoiceUseCase.execute).mockResolvedValue({
      ...invoice,
      paid_amount_cents: 20000,
      status: 'partially_paid',
    } as never)

    const tool = createPayInvoiceTool(ctx)
    const result = (await tool.execute!(
      {
        credit_card_name: 'Nubank',
        reference_month: '2026-02',
        amount_cents: 20000,
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('invoice_paid')
    expect(result.message).toContain('200,00')
    expect(result.message).toContain('Restante')
    expect(result.message).toContain('300,00')
    expect(ctx.payInvoiceUseCase.execute).toHaveBeenCalledWith('test-user-id', 'inv-1', 20000)
  })

  it('returns success when invoice is already paid', async () => {
    ctx.supabase = createCreditCardSupabaseMock({
      data: { id: 'card-1', name: 'Nubank' },
      error: null,
    })

    const invoice = {
      id: 'inv-1',
      total_amount_cents: 50000,
      carry_over_cents: 0,
      paid_amount_cents: 50000,
      status: 'paid',
    }
    vi.mocked(ctx.getOrCreateInvoiceUseCase.execute).mockResolvedValue({
      invoice,
      transactions: [],
    } as never)

    const tool = createPayInvoiceTool(ctx)
    const result = (await tool.execute!(
      {
        credit_card_name: 'Nubank',
        reference_month: '2026-02',
        pay_full: true,
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('invoice_paid')
    expect(result.message).toContain('já está paga')
    expect(ctx.payInvoiceUseCase.execute).not.toHaveBeenCalled()
  })

  it('returns error when card is not found by name', async () => {
    const tool = createPayInvoiceTool(ctx)
    const result = (await tool.execute!(
      {
        credit_card_name: 'NonExistent',
        reference_month: '2026-02',
        pay_full: true,
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('NonExistent')
  })

  it('returns error when user has no cards and no card name provided', async () => {
    vi.mocked(ctx.creditCardsRepository.findByUserId).mockResolvedValue([])

    const tool = createPayInvoiceTool(ctx)
    const result = (await tool.execute!(
      { reference_month: '2026-02', pay_full: true },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('não tem cartões')
  })

  it('returns disambiguation error when user has multiple cards and no card name provided', async () => {
    vi.mocked(ctx.creditCardsRepository.findByUserId).mockResolvedValue([
      { id: 'card-1', name: 'Nubank' },
      { id: 'card-2', name: 'Inter' },
    ] as never)

    const tool = createPayInvoiceTool(ctx)
    const result = (await tool.execute!(
      { reference_month: '2026-02', pay_full: true },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('mais de um cartão')
  })

  it('auto-resolves card when user has only one card and no card name provided', async () => {
    vi.mocked(ctx.creditCardsRepository.findByUserId).mockResolvedValue([
      { id: 'card-1', name: 'Nubank' },
    ] as never)

    const invoice = {
      id: 'inv-1',
      total_amount_cents: 30000,
      carry_over_cents: 0,
      paid_amount_cents: 0,
      status: 'open',
    }
    vi.mocked(ctx.getOrCreateInvoiceUseCase.execute).mockResolvedValue({
      invoice,
      transactions: [],
    } as never)
    vi.mocked(ctx.payInvoiceUseCase.execute).mockResolvedValue({
      ...invoice,
      paid_amount_cents: 30000,
      status: 'paid',
    } as never)

    const tool = createPayInvoiceTool(ctx)
    const result = (await tool.execute!(
      { reference_month: '2026-02', pay_full: true },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('invoice_paid')
    expect(result.message).toContain('Nubank')
    expect(ctx.getOrCreateInvoiceUseCase.execute).toHaveBeenCalledWith(
      'test-user-id',
      'card-1',
      '2026-02'
    )
  })

  it('returns error when getOrCreateInvoice throws', async () => {
    ctx.supabase = createCreditCardSupabaseMock({
      data: { id: 'card-1', name: 'Nubank' },
      error: null,
    })
    vi.mocked(ctx.getOrCreateInvoiceUseCase.execute).mockRejectedValue(new Error('DB error'))

    const tool = createPayInvoiceTool(ctx)
    const result = (await tool.execute!(
      {
        credit_card_name: 'Nubank',
        reference_month: '2026-02',
        pay_full: true,
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('pagamento da fatura')
  })

  it('handles invoice with carry_over_cents in remaining calculation', async () => {
    ctx.supabase = createCreditCardSupabaseMock({
      data: { id: 'card-1', name: 'Nubank' },
      error: null,
    })

    const invoice = {
      id: 'inv-1',
      total_amount_cents: 50000,
      carry_over_cents: 10000,
      paid_amount_cents: 0,
      status: 'open',
    }
    vi.mocked(ctx.getOrCreateInvoiceUseCase.execute).mockResolvedValue({
      invoice,
      transactions: [],
    } as never)
    vi.mocked(ctx.payInvoiceUseCase.execute).mockResolvedValue({
      ...invoice,
      paid_amount_cents: 60000,
      status: 'paid',
    } as never)

    const tool = createPayInvoiceTool(ctx)
    const result = (await tool.execute!(
      {
        credit_card_name: 'Nubank',
        reference_month: '2026-02',
        pay_full: true,
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(ctx.payInvoiceUseCase.execute).toHaveBeenCalledWith('test-user-id', 'inv-1', 60000)
  })
})
