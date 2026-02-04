import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AIRepository } from '../ai/ai.repository'
import type { CreateExpenseData } from './expenses.repository'
import { ExpensesRepository } from './expenses.repository'

function createMockSupabaseClient() {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockFrom = vi.fn()
  const mockEq = vi.fn()
  const mockOrder = vi.fn()

  const chainMethods = {
    eq: mockEq,
    order: mockOrder,
    select: mockSelect,
    single: mockSingle,
  }

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })

  mockSelect.mockReturnValue(chainMethods)
  mockInsert.mockReturnValue({ select: mockSelect })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue(chainMethods)
  mockOrder.mockReturnValue(chainMethods)

  const supabase = {
    from: mockFrom,
  } as unknown as SupabaseClient

  return {
    supabase,
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockEq,
    mockSingle,
  }
}

describe('Cache Invalidation Flow', () => {
  const userId = 'user-123'
  let mocks: ReturnType<typeof createMockSupabaseClient>
  let expensesRepository: ExpensesRepository
  let aiRepository: AIRepository
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clearCacheSpy: any

  beforeEach(() => {
    vi.clearAllMocks()
    mocks = createMockSupabaseClient()

    aiRepository = new AIRepository(mocks.supabase)
    clearCacheSpy = vi.spyOn(aiRepository, 'clearUserCache').mockResolvedValue()

    const onCacheInvalidate = async (uid: string): Promise<void> => {
      await aiRepository.clearUserCache(uid)
    }

    expensesRepository = new ExpensesRepository(mocks.supabase, onCacheInvalidate)
  })

  describe('create expense invalidates cache', () => {
    const input: CreateExpenseData = {
      category_id: 'cat-1',
      description: 'Test Expense',
      amount_cents: 5000,
      payment_method: 'pix',
      date: '2024-01-15',
    }

    it('clears AI cache after successful expense creation', async () => {
      const createdExpense = {
        id: 'exp-1',
        user_id: userId,
        ...input,
      }
      mocks.mockSingle.mockResolvedValue({ data: createdExpense, error: null })

      await expensesRepository.create(userId, input)

      expect(clearCacheSpy).toHaveBeenCalledTimes(1)
      expect(clearCacheSpy).toHaveBeenCalledWith(userId)
    })

    it('does not clear cache when expense creation fails', async () => {
      mocks.mockSingle.mockResolvedValue({ data: null, error: new Error('Insert failed') })

      await expensesRepository.create(userId, input)

      expect(clearCacheSpy).not.toHaveBeenCalled()
    })
  })

  describe('update expense invalidates cache', () => {
    it('clears AI cache after successful expense update', async () => {
      const expenseId = 'exp-1'
      const updatedExpense = {
        id: expenseId,
        user_id: userId,
        description: 'Updated Expense',
      }
      mocks.mockSingle.mockResolvedValue({ data: updatedExpense, error: null })

      await expensesRepository.update(expenseId, userId, { description: 'Updated Expense' })

      expect(clearCacheSpy).toHaveBeenCalledTimes(1)
      expect(clearCacheSpy).toHaveBeenCalledWith(userId)
    })

    it('does not clear cache when expense update fails', async () => {
      mocks.mockSingle.mockResolvedValue({ data: null, error: new Error('Update failed') })

      await expensesRepository.update('exp-1', userId, { description: 'Updated' })

      expect(clearCacheSpy).not.toHaveBeenCalled()
    })
  })

  describe('delete expense invalidates cache', () => {
    it('clears AI cache after successful expense deletion', async () => {
      const expenseId = 'exp-1'
      const mockDeleteEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null, count: 1 }),
      })
      mocks.mockDelete.mockReturnValue({ eq: mockDeleteEq })

      await expensesRepository.delete(expenseId, userId)

      expect(clearCacheSpy).toHaveBeenCalledTimes(1)
      expect(clearCacheSpy).toHaveBeenCalledWith(userId)
    })

    it('does not clear cache when expense not found', async () => {
      const mockDeleteEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null, count: 0 }),
      })
      mocks.mockDelete.mockReturnValue({ eq: mockDeleteEq })

      await expensesRepository.delete('nonexistent', userId)

      expect(clearCacheSpy).not.toHaveBeenCalled()
    })
  })

  describe('delete installment group invalidates cache', () => {
    it('clears AI cache after successful installment group deletion', async () => {
      const groupId = 'group-1'
      const mockDeleteEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null, count: 3 }),
      })
      mocks.mockDelete.mockReturnValue({ eq: mockDeleteEq })

      await expensesRepository.deleteByGroupId(groupId, userId)

      expect(clearCacheSpy).toHaveBeenCalledTimes(1)
      expect(clearCacheSpy).toHaveBeenCalledWith(userId)
    })

    it('does not clear cache when installment group not found', async () => {
      const mockDeleteEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null, count: 0 }),
      })
      mocks.mockDelete.mockReturnValue({ eq: mockDeleteEq })

      await expensesRepository.deleteByGroupId('nonexistent', userId)

      expect(clearCacheSpy).not.toHaveBeenCalled()
    })
  })

  describe('batch create expenses invalidates cache', () => {
    it('clears AI cache once after creating multiple expenses', async () => {
      const inputs: CreateExpenseData[] = [
        {
          category_id: 'cat-1',
          description: 'Installment 1/3',
          amount_cents: 3334,
          payment_method: 'credit_card',
          date: '2024-01-01',
          installment_current: 1,
          installment_total: 3,
          installment_group_id: 'group-1',
        },
        {
          category_id: 'cat-1',
          description: 'Installment 2/3',
          amount_cents: 3334,
          payment_method: 'credit_card',
          date: '2024-02-01',
          installment_current: 2,
          installment_total: 3,
          installment_group_id: 'group-1',
        },
      ]
      const createdExpenses = inputs.map((input, i) => ({
        id: `exp-${i}`,
        user_id: userId,
        ...input,
      }))
      mocks.mockSelect.mockResolvedValue({ data: createdExpenses, error: null })

      await expensesRepository.createMany(userId, inputs)

      expect(clearCacheSpy).toHaveBeenCalledTimes(1)
      expect(clearCacheSpy).toHaveBeenCalledWith(userId)
    })

    it('does not clear cache when batch creation fails', async () => {
      const inputs: CreateExpenseData[] = [
        {
          category_id: 'cat-1',
          description: 'Test',
          amount_cents: 1000,
          payment_method: 'pix',
          date: '2024-01-01',
        },
      ]
      mocks.mockSelect.mockResolvedValue({ data: null, error: new Error('Insert failed') })

      await expensesRepository.createMany(userId, inputs)

      expect(clearCacheSpy).not.toHaveBeenCalled()
    })
  })

  describe('cache freshness after mutation', () => {
    it('queries return fresh data after cache is cleared', async () => {
      const input: CreateExpenseData = {
        category_id: 'cat-1',
        description: 'New Expense',
        amount_cents: 5000,
        payment_method: 'pix',
        date: '2024-01-15',
      }
      const createdExpense = { id: 'exp-1', user_id: userId, ...input }
      mocks.mockSingle.mockResolvedValue({ data: createdExpense, error: null })

      await expensesRepository.create(userId, input)

      expect(clearCacheSpy).toHaveBeenCalledWith(userId)
    })
  })
})
