import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionResult, ToolContext } from './types'
import { createUpdateSalaryTool } from './update-salary.tool'

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

describe('createUpdateSalaryTool', () => {
  let ctx: ToolContext

  beforeEach(() => {
    ctx = createMockContext()
  })

  it('returns success with formatted amount when salary is created', async () => {
    const salaryResult = {
      id: 'salary-1',
      user_id: 'test-user-id',
      amount_cents: 500000,
      effective_from: '2026-02-01',
      created_at: '2026-02-01T00:00:00.000Z',
    }
    vi.mocked(ctx.createSalaryUseCase.execute).mockResolvedValue(salaryResult)

    const tool = createUpdateSalaryTool(ctx)
    const result = (await tool.execute!(
      { amount_cents: 500000, effective_from: '2026-02-01' },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('salary_updated')
    expect(result.message).toContain('5.000,00')
    expect(result.message).toContain('2026-02-01')
    expect(result.data).toEqual(salaryResult)
    expect(ctx.createSalaryUseCase.execute).toHaveBeenCalledWith('test-user-id', {
      amount_cents: 500000,
      effective_from: '2026-02-01',
    })
  })

  it('defaults effective_from to first day of current month when not provided', async () => {
    const salaryResult = {
      id: 'salary-1',
      user_id: 'test-user-id',
      amount_cents: 300000,
      effective_from: '2026-02-01',
      created_at: '2026-02-01T00:00:00.000Z',
    }
    vi.mocked(ctx.createSalaryUseCase.execute).mockResolvedValue(salaryResult)

    const tool = createUpdateSalaryTool(ctx)
    const result = (await tool.execute!(
      { amount_cents: 300000 },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('salary_updated')
    const callArgs = vi.mocked(ctx.createSalaryUseCase.execute).mock.calls[0]!
    expect(callArgs[1].effective_from).toMatch(/^\d{4}-\d{2}-01$/)
  })

  it('returns error when usecase throws', async () => {
    vi.mocked(ctx.createSalaryUseCase.execute).mockRejectedValue(new Error('DB error'))

    const tool = createUpdateSalaryTool(ctx)
    const result = (await tool.execute!(
      { amount_cents: 500000 },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('salário')
  })
})
