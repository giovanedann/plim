import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeQuery } from './execute-query'

type MockSupabase = {
  rpc: ReturnType<typeof vi.fn>
}

function createMockSupabase(): MockSupabase {
  return {
    rpc: vi.fn(),
  }
}

describe('executeQuery', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000'
  let mockSupabase: MockSupabase

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
  })

  describe('parameter validation', () => {
    it('returns error for missing sql parameter', async () => {
      const result = await executeQuery({ description: 'test' }, userId, mockSupabase as never)

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('Não consegui entender')
    })

    it('returns error for missing description parameter', async () => {
      const result = await executeQuery(
        { sql: "SELECT * FROM expense WHERE user_id = '{userId}'" },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
    })

    it('returns error for empty sql', async () => {
      const result = await executeQuery(
        { sql: '', description: 'test' },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
    })
  })

  describe('SQL security validation', () => {
    it('blocks DELETE statements', async () => {
      const result = await executeQuery(
        {
          sql: "DELETE FROM expense WHERE user_id = '{userId}'",
          description: 'delete_expenses',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('DELETE')
      expect(result.message).toContain('não permitida')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks INSERT statements', async () => {
      const result = await executeQuery(
        {
          sql: "INSERT INTO expense (user_id) VALUES ('{userId}')",
          description: 'insert_expense',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('INSERT')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks UPDATE statements', async () => {
      const result = await executeQuery(
        {
          sql: "UPDATE expense SET amount_cents = 0 WHERE user_id = '{userId}'",
          description: 'update_expenses',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('UPDATE')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks DROP statements', async () => {
      const result = await executeQuery(
        {
          sql: "DROP TABLE expense -- SELECT * FROM expense WHERE user_id = '{userId}'",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('DROP')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks TRUNCATE statements', async () => {
      const result = await executeQuery(
        {
          sql: "TRUNCATE expense WHERE user_id = '{userId}'",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('TRUNCATE')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks ALTER statements', async () => {
      const result = await executeQuery(
        {
          sql: "ALTER TABLE expense ADD COLUMN hack TEXT WHERE user_id = '{userId}'",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('ALTER')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks CREATE statements', async () => {
      const result = await executeQuery(
        {
          sql: "CREATE TABLE hack AS SELECT * FROM expense WHERE user_id = '{userId}'",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('CREATE')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('rejects non-SELECT queries', async () => {
      const result = await executeQuery(
        {
          sql: "WITH cte AS (DELETE FROM expense RETURNING *) SELECT * FROM cte WHERE user_id = '{userId}'",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks semicolons (multi-statement prevention)', async () => {
      const result = await executeQuery(
        {
          sql: "SELECT * FROM expense WHERE user_id = '{userId}'; DROP TABLE expense",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('Múltiplas instruções')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks access to auth.users', async () => {
      const result = await executeQuery(
        {
          sql: "SELECT * FROM auth.users WHERE id = '{userId}'",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('tabelas do sistema')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks access to pg_catalog', async () => {
      const result = await executeQuery(
        {
          sql: "SELECT * FROM pg_catalog.pg_tables WHERE user_id = '{userId}'",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('tabelas do sistema')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks access to information_schema', async () => {
      const result = await executeQuery(
        {
          sql: "SELECT * FROM information_schema.tables WHERE user_id = '{userId}'",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('tabelas do sistema')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('blocks COPY keyword', async () => {
      const result = await executeQuery(
        {
          sql: "COPY expense TO '/tmp/data.csv' WHERE user_id = '{userId}'",
          description: 'malicious',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('rejects invalid userId format', async () => {
      const result = await executeQuery(
        {
          sql: "SELECT * FROM expense WHERE user_id = '{userId}'",
          description: 'test',
        },
        'not-a-uuid',
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('ID de usuário inválido')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('requires user_id filter in query', async () => {
      const result = await executeQuery(
        {
          sql: 'SELECT * FROM expense',
          description: 'all_expenses',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('user_id')
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('accepts query with {userId} placeholder', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      const result = await executeQuery(
        {
          sql: "SELECT * FROM expense WHERE user_id = '{userId}'",
          description: 'test',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('execute_readonly_sql', {
        query_text: `SELECT * FROM expense WHERE user_id = '${userId}'`,
      })
    })

    it('accepts query with literal userId', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      const result = await executeQuery(
        {
          sql: `SELECT * FROM expense WHERE user_id = '${userId}'`,
          description: 'test',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
    })
  })

  describe('query execution', () => {
    it('replaces {userId} placeholder with actual userId', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      await executeQuery(
        {
          sql: "SELECT * FROM expense WHERE user_id = '{userId}' AND category_id = '{userId}'",
          description: 'test',
        },
        userId,
        mockSupabase as never
      )

      expect(mockSupabase.rpc).toHaveBeenCalledWith('execute_readonly_sql', {
        query_text: `SELECT * FROM expense WHERE user_id = '${userId}' AND category_id = '${userId}'`,
      })
    })

    it('returns error on database error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const result = await executeQuery(
        {
          sql: "SELECT * FROM expense WHERE user_id = '{userId}'",
          description: 'test',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('Erro')
    })
  })

  describe('result formatting', () => {
    // Note: Detailed formatting is now handled by AI in chat.usecase.ts
    // These tests verify that raw data is correctly returned for AI formatting

    it('returns empty results message when no data', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null })

      const result = await executeQuery(
        {
          sql: "SELECT * FROM expense WHERE user_id = '{userId}'",
          description: 'test',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('Nenhum resultado')
      expect(result.data).toEqual({ rows: [], count: 0 })
    })

    it('returns raw data for grouped expenses by category', async () => {
      const data = [
        { categoria: 'Alimentação', total: 150000 },
        { categoria: 'Transporte', total: 50000 },
      ]
      mockSupabase.rpc.mockResolvedValue({ data, error: null })

      const result = await executeQuery(
        {
          sql: "SELECT c.name as categoria, SUM(e.amount_cents) as total FROM expense e JOIN category c ON e.category_id = c.id WHERE e.user_id = '{userId}' GROUP BY c.name",
          description: 'expenses_by_category',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      // Raw data is returned for AI formatting
      const resultData = result.data as { rows: typeof data; count: number }
      expect(resultData.rows).toEqual(data)
      expect(resultData.count).toBe(2)
    })

    it('returns raw data for grouped expenses by credit card', async () => {
      const data = [
        { cartao: 'Nubank', total: 200000 },
        { cartao: 'Itaú', total: 80000 },
      ]
      mockSupabase.rpc.mockResolvedValue({ data, error: null })

      const result = await executeQuery(
        {
          sql: "SELECT cc.name as cartao, SUM(e.amount_cents) as total FROM expense e JOIN credit_card cc ON e.credit_card_id = cc.id WHERE e.user_id = '{userId}' GROUP BY cc.name",
          description: 'expenses_by_credit_card',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      const resultData = result.data as { rows: typeof data; count: number }
      expect(resultData.rows).toEqual(data)
      expect(resultData.count).toBe(2)
    })

    it('returns raw data for expenses count by payment method', async () => {
      const data = [
        { payment_method: 'pix', quantidade: 10 },
        { payment_method: 'credit_card', quantidade: 5 },
        { payment_method: 'cash', quantidade: 2 },
      ]
      mockSupabase.rpc.mockResolvedValue({ data, error: null })

      const result = await executeQuery(
        {
          sql: "SELECT payment_method, COUNT(*) as quantidade FROM expense WHERE user_id = '{userId}' GROUP BY payment_method",
          description: 'count_by_payment_method',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      const resultData = result.data as { rows: typeof data; count: number }
      expect(resultData.rows).toEqual(data)
      expect(resultData.count).toBe(3)
    })

    it('returns raw data for single total result', async () => {
      const data = [{ total: 350000 }]
      mockSupabase.rpc.mockResolvedValue({ data, error: null })

      const result = await executeQuery(
        {
          sql: "SELECT SUM(amount_cents) as total FROM expense WHERE user_id = '{userId}'",
          description: 'monthly_total',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      const resultData = result.data as { rows: typeof data; count: number }
      expect(resultData.rows).toEqual(data)
      expect(resultData.count).toBe(1)
    })

    it('returns raw data for credit cards list', async () => {
      const data = [
        { name: 'Nubank', flag: 'mastercard', bank: 'Nubank' },
        { name: 'Itaú Personnalité', flag: 'visa', bank: 'Itaú' },
      ]
      mockSupabase.rpc.mockResolvedValue({ data, error: null })

      const result = await executeQuery(
        {
          sql: "SELECT name, flag, bank FROM credit_card WHERE user_id = '{userId}' AND is_active = true",
          description: 'list_credit_cards',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      const resultData = result.data as { rows: typeof data; count: number }
      expect(resultData.rows).toEqual(data)
      expect(resultData.count).toBe(2)
    })

    it('returns raw data for categories list', async () => {
      const data = [{ name: 'Alimentação' }, { name: 'Transporte' }, { name: 'Lazer' }]
      mockSupabase.rpc.mockResolvedValue({ data, error: null })

      const result = await executeQuery(
        {
          sql: "SELECT name FROM category WHERE (user_id = '{userId}' OR user_id IS NULL) AND is_active = true",
          description: 'list_categories',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      const resultData = result.data as { rows: typeof data; count: number }
      expect(resultData.rows).toEqual(data)
      expect(resultData.count).toBe(3)
    })

    it('returns raw data for expense list with amount_cents', async () => {
      const data = [
        { description: 'Almoço', amount_cents: 5000, date: '2026-02-01', categoria: 'Alimentação' },
        { description: 'Uber', amount_cents: 2500, date: '2026-02-02', categoria: 'Transporte' },
      ]
      mockSupabase.rpc.mockResolvedValue({ data, error: null })

      const result = await executeQuery(
        {
          sql: "SELECT e.description, e.amount_cents, e.date, c.name as categoria FROM expense e JOIN category c ON e.category_id = c.id WHERE e.user_id = '{userId}'",
          description: 'expense_list',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('query_result')
      const resultData = result.data as { rows: typeof data; count: number }
      expect(resultData.rows).toEqual(data)
      expect(resultData.count).toBe(2)
    })

    it('limits result rows to 50 items for AI processing', async () => {
      const data = Array.from({ length: 60 }, (_, i) => ({
        description: `Expense ${i + 1}`,
        amount_cents: 1000,
        date: '2026-02-01',
      }))
      mockSupabase.rpc.mockResolvedValue({ data, error: null })

      const result = await executeQuery(
        {
          sql: "SELECT description, amount_cents, date FROM expense WHERE user_id = '{userId}'",
          description: 'expense_list',
        },
        userId,
        mockSupabase as never
      )

      expect(result.success).toBe(true)
      const resultData = result.data as { rows: unknown[]; count: number }
      // Limited to 50 rows for AI processing
      expect(resultData.rows).toHaveLength(50)
      // But count reflects total
      expect(resultData.count).toBe(60)
    })
  })
})
