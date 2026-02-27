import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionResult, ToolContext } from './types'
import { createUpdateCreditCardTool } from './update-credit-card.tool'

function createSupabaseMock(singleResult: {
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
                single: vi.fn().mockResolvedValue(singleResult),
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

describe('createUpdateCreditCardTool', () => {
  let ctx: ToolContext

  beforeEach(() => {
    ctx = createMockContext()
  })

  it('updates closing day successfully', async () => {
    ctx.supabase = createSupabaseMock({
      data: { id: 'card-1', name: 'Nubank', user_id: 'test-user-id' },
      error: null,
    })
    vi.mocked(ctx.updateCreditCardUseCase.execute).mockResolvedValue({
      id: 'card-1',
      name: 'Nubank',
      closing_day: 15,
    } as never)

    const tool = createUpdateCreditCardTool(ctx)
    const result = (await tool.execute!(
      { credit_card_name: 'Nubank', closing_day: 15 },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('credit_card_updated')
    expect(result.message).toContain('Nubank')
    expect(result.message).toContain('dia de fechamento para 15')
    expect(ctx.updateCreditCardUseCase.execute).toHaveBeenCalledWith('test-user-id', 'card-1', {
      closing_day: 15,
    })
  })

  it('updates credit limit successfully', async () => {
    ctx.supabase = createSupabaseMock({
      data: { id: 'card-1', name: 'Nubank', user_id: 'test-user-id' },
      error: null,
    })
    vi.mocked(ctx.updateCreditCardUseCase.execute).mockResolvedValue({
      id: 'card-1',
      name: 'Nubank',
      credit_limit_cents: 1000000,
    } as never)

    const tool = createUpdateCreditCardTool(ctx)
    const result = (await tool.execute!(
      { credit_card_name: 'Nubank', credit_limit_cents: 1000000 },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('credit_card_updated')
    expect(result.message).toContain('limite para')
    expect(result.message).toContain('10.000,00')
  })

  it('returns error when card is not found', async () => {
    const tool = createUpdateCreditCardTool(ctx)
    const result = (await tool.execute!(
      { credit_card_name: 'NonExistent', closing_day: 10 },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('NonExistent')
  })

  it('returns error when no fields to update are provided', async () => {
    ctx.supabase = createSupabaseMock({
      data: { id: 'card-1', name: 'Nubank', user_id: 'test-user-id' },
      error: null,
    })

    const tool = createUpdateCreditCardTool(ctx)
    const result = (await tool.execute!(
      { credit_card_name: 'Nubank' },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('Nenhuma alteração')
  })

  it('returns error when usecase throws', async () => {
    ctx.supabase = createSupabaseMock({
      data: { id: 'card-1', name: 'Nubank', user_id: 'test-user-id' },
      error: null,
    })
    vi.mocked(ctx.updateCreditCardUseCase.execute).mockRejectedValue(new Error('DB error'))

    const tool = createUpdateCreditCardTool(ctx)
    const result = (await tool.execute!(
      { credit_card_name: 'Nubank', closing_day: 10 },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('atualizar o cartão')
  })
})
