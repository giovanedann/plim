import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createForecastSpendingTool } from './forecast-spending.tool'
import type { ActionResult, ToolContext } from './types'

function createMockContext(overrides?: Partial<ToolContext>): ToolContext {
  return {
    userId: 'test-user-id',
    supabase: {} as unknown as ToolContext['supabase'],
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

describe('createForecastSpendingTool', () => {
  let ctx: ToolContext

  beforeEach(() => {
    ctx = createMockContext()
  })

  it('returns forecast for default 3 months with breakdown', async () => {
    vi.mocked(ctx.expensesRepository.findByUserId)
      .mockResolvedValueOnce([
        {
          id: 'e1',
          amount_cents: 5000,
          is_recurrent: false,
          installment_total: null,
        },
        {
          id: 'e2',
          amount_cents: 3000,
          is_recurrent: true,
          installment_total: null,
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'e3',
          amount_cents: 3000,
          is_recurrent: true,
          installment_total: null,
        },
        {
          id: 'e4',
          amount_cents: 2000,
          is_recurrent: false,
          installment_total: 3,
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'e5',
          amount_cents: 3000,
          is_recurrent: true,
          installment_total: null,
        },
      ] as never)

    const tool = createForecastSpendingTool(ctx)
    const result = (await tool.execute!(
      { months_ahead: 3, include_recurrent: true, include_installments: true },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('forecast_result')
    expect(result.message).toContain('Previsão de gastos')

    const data = result.data as {
      total: number
      forecasts: Array<{
        month: string
        total: number
        breakdown: { oneTime: number; recurrent: number; installments: number }
      }>
    }
    expect(data.forecasts).toHaveLength(3)

    expect(data.forecasts[0]!.breakdown.oneTime).toBe(5000)
    expect(data.forecasts[0]!.breakdown.recurrent).toBe(3000)

    expect(data.forecasts[1]!.breakdown.recurrent).toBe(3000)
    expect(data.forecasts[1]!.breakdown.installments).toBe(2000)

    expect(data.total).toBe(data.forecasts.reduce((sum, f) => sum + f.total, 0))
  })

  it('excludes recurrent expenses when include_recurrent is false', async () => {
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue([
      {
        id: 'e1',
        amount_cents: 5000,
        is_recurrent: false,
        installment_total: null,
      },
      {
        id: 'e2',
        amount_cents: 3000,
        is_recurrent: true,
        installment_total: null,
      },
    ] as never)

    const tool = createForecastSpendingTool(ctx)
    const result = (await tool.execute!(
      { months_ahead: 1, include_recurrent: false, include_installments: true },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    const data = result.data as {
      forecasts: Array<{
        breakdown: { oneTime: number; recurrent: number; installments: number }
      }>
    }
    expect(data.forecasts[0]!.breakdown.recurrent).toBe(0)
    expect(data.forecasts[0]!.breakdown.oneTime).toBe(5000)
  })

  it('excludes installments when include_installments is false', async () => {
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue([
      {
        id: 'e1',
        amount_cents: 5000,
        is_recurrent: false,
        installment_total: null,
      },
      {
        id: 'e2',
        amount_cents: 2000,
        is_recurrent: false,
        installment_total: 3,
      },
    ] as never)

    const tool = createForecastSpendingTool(ctx)
    const result = (await tool.execute!(
      { months_ahead: 1, include_recurrent: true, include_installments: false },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    const data = result.data as {
      forecasts: Array<{
        breakdown: { oneTime: number; recurrent: number; installments: number }
      }>
    }
    expect(data.forecasts[0]!.breakdown.installments).toBe(0)
    expect(data.forecasts[0]!.breakdown.oneTime).toBe(5000)
  })

  it('returns zero totals when no expenses exist', async () => {
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue([])

    const tool = createForecastSpendingTool(ctx)
    const result = (await tool.execute!(
      { months_ahead: 2, include_recurrent: true, include_installments: true },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    const data = result.data as {
      total: number
      forecasts: Array<{ total: number }>
    }
    expect(data.total).toBe(0)
    expect(data.forecasts).toHaveLength(2)
    expect(data.forecasts[0]!.total).toBe(0)
    expect(data.forecasts[1]!.total).toBe(0)
  })

  it('queries expenses repository for each month', async () => {
    vi.mocked(ctx.expensesRepository.findByUserId).mockResolvedValue([])

    const tool = createForecastSpendingTool(ctx)
    await tool.execute!(
      { months_ahead: 3, include_recurrent: true, include_installments: true },
      toolCallOpts
    )

    expect(ctx.expensesRepository.findByUserId).toHaveBeenCalledTimes(3)

    for (const call of vi.mocked(ctx.expensesRepository.findByUserId).mock.calls) {
      expect(call[0]).toBe('test-user-id')
      const filters = call[1] as { start_date: string; end_date: string }
      expect(filters.start_date).toMatch(/^\d{4}-\d{2}-01$/)
      expect(filters.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
