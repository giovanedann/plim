import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createExecuteQueryTool } from './execute-query.tool'
import type { ActionResult, ToolContext } from './types'

const VALID_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

function createMockContext(overrides?: Partial<ToolContext>): ToolContext {
  return {
    userId: VALID_USER_ID,
    supabase: {
      rpc: vi.fn(),
    } as unknown as ToolContext['supabase'],
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

describe('createExecuteQueryTool', () => {
  let ctx: ToolContext

  beforeEach(() => {
    ctx = createMockContext()
  })

  it('executes a valid SELECT query and returns rows', async () => {
    const rows = [
      { id: '1', description: 'Lunch', amount_cents: 3500 },
      { id: '2', description: 'Dinner', amount_cents: 5000 },
    ]
    vi.mocked(ctx.supabase.rpc).mockResolvedValue({ data: rows, error: null } as never)

    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `SELECT * FROM expenses WHERE user_id = '${VALID_USER_ID}'`,
        description: 'List expenses',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('query_result')
    const data = result.data as { rows: unknown[]; count: number }
    expect(data.rows).toHaveLength(2)
    expect(data.count).toBe(2)
  })

  it('replaces {userId} placeholder in SQL', async () => {
    vi.mocked(ctx.supabase.rpc).mockResolvedValue({ data: [], error: null } as never)

    const tool = createExecuteQueryTool(ctx)
    await tool.execute!(
      {
        sql: "SELECT * FROM expenses WHERE user_id = '{userId}'",
        description: 'List expenses',
      },
      toolCallOpts
    )

    expect(ctx.supabase.rpc).toHaveBeenCalledWith('execute_readonly_sql', {
      query_text: expect.stringContaining(VALID_USER_ID),
    })
  })

  it('returns empty result message when no rows found', async () => {
    vi.mocked(ctx.supabase.rpc).mockResolvedValue({ data: [], error: null } as never)

    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `SELECT * FROM expenses WHERE user_id = '${VALID_USER_ID}'`,
        description: 'List expenses',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.message).toContain('Nenhum resultado')
  })

  it('blocks DROP keyword', async () => {
    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `DROP TABLE expenses WHERE user_id = '${VALID_USER_ID}'`,
        description: 'Drop table',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('DROP')
    expect(ctx.supabase.rpc).not.toHaveBeenCalled()
  })

  it('blocks DELETE keyword', async () => {
    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `DELETE FROM expenses WHERE user_id = '${VALID_USER_ID}'`,
        description: 'Delete expenses',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('DELETE')
  })

  it('blocks UPDATE keyword', async () => {
    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `UPDATE expenses SET amount_cents = 0 WHERE user_id = '${VALID_USER_ID}'`,
        description: 'Update expenses',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('UPDATE')
  })

  it('blocks INSERT keyword', async () => {
    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `INSERT INTO expenses (user_id) VALUES ('${VALID_USER_ID}')`,
        description: 'Insert expense',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('INSERT')
  })

  it('blocks multi-statement queries containing semicolons', async () => {
    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `SELECT * FROM expenses WHERE user_id = '${VALID_USER_ID}'; DROP TABLE expenses`,
        description: 'SQL injection',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('Multiplas instrucoes')
  })

  it('blocks queries without user_id filter', async () => {
    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: 'SELECT * FROM expenses',
        description: 'List all expenses',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('user_id')
  })

  it('blocks access to system tables', async () => {
    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `SELECT * FROM auth.users WHERE user_id = '${VALID_USER_ID}'`,
        description: 'Access auth table',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('tabelas do sistema')
  })

  it('blocks access to pg_catalog', async () => {
    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `SELECT * FROM pg_catalog.pg_tables WHERE user_id = '${VALID_USER_ID}'`,
        description: 'Access pg_catalog',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('tabelas do sistema')
  })

  it('blocks non-SELECT queries', async () => {
    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `EXPLAIN SELECT * FROM expenses WHERE user_id = '${VALID_USER_ID}'`,
        description: 'Explain query',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('Apenas consultas SELECT')
  })

  it('allows WITH (CTE) queries', async () => {
    vi.mocked(ctx.supabase.rpc).mockResolvedValue({ data: [{ total: 100 }], error: null } as never)

    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `WITH totals AS (SELECT SUM(amount_cents) as total FROM expenses WHERE user_id = '${VALID_USER_ID}') SELECT * FROM totals`,
        description: 'CTE query',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('query_result')
  })

  it('returns error when rpc returns an error', async () => {
    vi.mocked(ctx.supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'SQL error' },
    } as never)

    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `SELECT * FROM expenses WHERE user_id = '${VALID_USER_ID}'`,
        description: 'Query with error',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('Erro ao executar')
  })

  it('returns error when rpc throws an exception', async () => {
    vi.mocked(ctx.supabase.rpc).mockRejectedValue(new Error('Network error'))

    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `SELECT * FROM expenses WHERE user_id = '${VALID_USER_ID}'`,
        description: 'Query with exception',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('Erro inesperado')
  })

  it('blocks queries when userId is not a valid UUID', async () => {
    ctx.userId = 'not-a-uuid'

    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: "SELECT * FROM expenses WHERE user_id = 'not-a-uuid'",
        description: 'Invalid user id',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('usuario invalido')
  })

  it('limits output to 50 rows', async () => {
    const manyRows = Array.from({ length: 100 }, (_, i) => ({ id: `row-${i}` }))
    vi.mocked(ctx.supabase.rpc).mockResolvedValue({ data: manyRows, error: null } as never)

    const tool = createExecuteQueryTool(ctx)
    const result = (await tool.execute!(
      {
        sql: `SELECT * FROM expenses WHERE user_id = '${VALID_USER_ID}'`,
        description: 'Query many rows',
      },
      toolCallOpts
    )) as ActionResult

    expect(result.success).toBe(true)
    const data = result.data as { rows: unknown[]; count: number }
    expect(data.rows).toHaveLength(50)
    expect(data.count).toBe(100)
  })
})
