import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryInvoicesTool } from './query-invoices.tool'
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

describe('createQueryInvoicesTool', () => {
  let ctx: ToolContext

  beforeEach(() => {
    ctx = createMockContext()
  })

  describe('invoice_details', () => {
    it('returns formatted invoice details', async () => {
      ctx.supabase = createCreditCardSupabaseMock({
        data: { id: 'card-1', name: 'Nubank' },
        error: null,
      })

      const invoice = {
        id: 'inv-1',
        total_amount_cents: 50000,
        carry_over_cents: 5000,
        paid_amount_cents: 10000,
        status: 'open',
      }
      const transactions = [
        { id: 't1', description: 'Lunch', amount_cents: 3000 },
        { id: 't2', description: 'Dinner', amount_cents: 5000 },
      ]
      vi.mocked(ctx.getOrCreateInvoiceUseCase.execute).mockResolvedValue({
        invoice,
        transactions,
      } as never)

      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        {
          query_type: 'invoice_details',
          credit_card_name: 'Nubank',
          reference_month: '2026-02',
        },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_result')
      expect(result.message).toContain('Nubank')
      expect(result.message).toContain('2026-02')
      expect(result.message).toContain('500,00')
      expect(result.message).toContain('100,00')
      expect(result.message).toContain('50,00')
      expect(result.message).toContain('450,00')
      expect(result.message).toContain('Aberta')
      expect(result.message).toContain('2')

      const data = result.data as {
        invoice: unknown
        transaction_count: number
        remaining_cents: number
      }
      expect(data.transaction_count).toBe(2)
      expect(data.remaining_cents).toBe(45000)
    })

    it('returns error when no card name is provided', async () => {
      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'invoice_details' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('Qual cartão')
    })

    it('returns error when card is not found', async () => {
      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        {
          query_type: 'invoice_details',
          credit_card_name: 'NonExistent',
        },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('NonExistent')
    })

    it('returns error when getOrCreateInvoice throws', async () => {
      ctx.supabase = createCreditCardSupabaseMock({
        data: { id: 'card-1', name: 'Nubank' },
        error: null,
      })
      vi.mocked(ctx.getOrCreateInvoiceUseCase.execute).mockRejectedValue(
        new Error('No closing day')
      )

      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        {
          query_type: 'invoice_details',
          credit_card_name: 'Nubank',
          reference_month: '2026-02',
        },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('dia de fechamento')
    })
  })

  describe('limit_usage', () => {
    it('returns limit usage information', async () => {
      ctx.supabase = createCreditCardSupabaseMock({
        data: { id: 'card-1', name: 'Nubank' },
        error: null,
      })

      const usage = {
        credit_limit_cents: 1000000,
        used_cents: 300000,
        available_cents: 700000,
      }
      vi.mocked(ctx.getCreditCardLimitUsageUseCase.execute).mockResolvedValue(usage as never)

      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'limit_usage', credit_card_name: 'Nubank' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_result')
      expect(result.message).toContain('Nubank')
      expect(result.message).toContain('10.000,00')
      expect(result.message).toContain('3.000,00')
      expect(result.message).toContain('7.000,00')
      expect(result.data).toEqual(usage)
    })

    it('returns error when no card name provided for limit_usage', async () => {
      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'limit_usage' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('Qual cartão')
    })

    it('returns error when card not found for limit_usage', async () => {
      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'limit_usage', credit_card_name: 'NonExistent' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('NonExistent')
    })

    it('returns error when limit usage usecase throws', async () => {
      ctx.supabase = createCreditCardSupabaseMock({
        data: { id: 'card-1', name: 'Nubank' },
        error: null,
      })
      vi.mocked(ctx.getCreditCardLimitUsageUseCase.execute).mockRejectedValue(new Error('No limit'))

      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'limit_usage', credit_card_name: 'Nubank' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('limite')
    })
  })

  describe('open_invoices', () => {
    it('returns all open invoices across cards', async () => {
      vi.mocked(ctx.creditCardsRepository.findByUserId).mockResolvedValue([
        { id: 'card-1', name: 'Nubank' },
        { id: 'card-2', name: 'Inter' },
      ] as never)

      vi.mocked(ctx.invoicesRepository.findUnpaidByCard)
        .mockResolvedValueOnce([
          {
            id: 'inv-1',
            reference_month: '2026-02',
            total_amount_cents: 50000,
            carry_over_cents: 0,
            paid_amount_cents: 0,
            status: 'open',
          },
        ] as never)
        .mockResolvedValueOnce([
          {
            id: 'inv-2',
            reference_month: '2026-02',
            total_amount_cents: 30000,
            carry_over_cents: 0,
            paid_amount_cents: 10000,
            status: 'partially_paid',
          },
        ] as never)

      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'open_invoices' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_result')
      expect(result.message).toContain('2')
      expect(result.message).toContain('Nubank')
      expect(result.message).toContain('Inter')

      const data = result.data as {
        invoices: unknown[]
        total_remaining_cents: number
      }
      expect(data.invoices).toHaveLength(2)
      expect(data.total_remaining_cents).toBe(70000)
    })

    it('returns message when no open invoices', async () => {
      vi.mocked(ctx.creditCardsRepository.findByUserId).mockResolvedValue([
        { id: 'card-1', name: 'Nubank' },
      ] as never)
      vi.mocked(ctx.invoicesRepository.findUnpaidByCard).mockResolvedValue([])

      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'open_invoices' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(true)
      expect(result.message).toContain('não tem faturas em aberto')
    })

    it('returns message when no cards registered', async () => {
      vi.mocked(ctx.creditCardsRepository.findByUserId).mockResolvedValue([])

      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'open_invoices' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(true)
      expect(result.message).toContain('não tem cartões')
    })

    it('filters open invoices by specific card name', async () => {
      ctx.supabase = createCreditCardSupabaseMock({
        data: { id: 'card-1', name: 'Nubank' },
        error: null,
      })
      vi.mocked(ctx.invoicesRepository.findUnpaidByCard).mockResolvedValue([
        {
          id: 'inv-1',
          reference_month: '2026-02',
          total_amount_cents: 50000,
          carry_over_cents: 0,
          paid_amount_cents: 0,
          status: 'open',
        },
      ] as never)

      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'open_invoices', credit_card_name: 'Nubank' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(true)
      expect(result.message).toContain('Nubank')
      expect(ctx.invoicesRepository.findUnpaidByCard).toHaveBeenCalledWith('card-1', 'test-user-id')
    })

    it('returns error when specific card name not found for open_invoices', async () => {
      const tool = createQueryInvoicesTool(ctx)
      const result = (await tool.execute!(
        { query_type: 'open_invoices', credit_card_name: 'NonExistent' },
        toolCallOpts
      )) as ActionResult

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('NonExistent')
    })
  })
})
