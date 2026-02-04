import type { Expense, ExpenseFilters, UpdateExpense } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CacheInvalidationFn, CreateExpenseData } from './expenses.repository'
import { ExpensesRepository } from './expenses.repository'

function createMockSupabaseClient() {
  const mockSingle = vi.fn()
  const mockRange = vi.fn()
  const mockOrder = vi.fn()
  const mockNot = vi.fn()
  const mockIs = vi.fn()
  const mockEq = vi.fn()
  const mockGte = vi.fn()
  const mockLte = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockFrom = vi.fn()

  const chainMethods = {
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    is: mockIs,
    not: mockNot,
    order: mockOrder,
    range: mockRange,
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
  const mockDeleteEq = vi.fn().mockReturnValue({ eq: vi.fn() })
  mockDelete.mockReturnValue({ eq: mockDeleteEq })

  mockEq.mockReturnValue(chainMethods)
  mockGte.mockReturnValue(chainMethods)
  mockLte.mockReturnValue(chainMethods)
  mockIs.mockReturnValue(chainMethods)
  mockNot.mockReturnValue(chainMethods)
  mockOrder.mockReturnValue(chainMethods)
  mockRange.mockReturnValue(chainMethods)

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
    mockDeleteEq,
    mockEq,
    mockGte,
    mockLte,
    mockIs,
    mockNot,
    mockOrder,
    mockRange,
    mockSingle,
  }
}

function createMockExpense(overrides: any = {}): Expense {
  return {
    id: 'expense-1',
    user_id: 'user-123',
    category_id: 'cat-1',
    description: 'Test Expense',
    amount_cents: 5000,
    payment_method: 'credit_card',
    date: '2024-01-15',
    is_recurrent: false,
    recurrence_day: null,
    recurrence_start: null,
    recurrence_end: null,
    installment_current: null,
    installment_total: null,
    installment_group_id: null,
    credit_card_id: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    ...overrides,
  }
}

describe('ExpensesRepository', () => {
  let sut: ExpensesRepository
  let mocks: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mocks = createMockSupabaseClient()
    sut = new ExpensesRepository(mocks.supabase)
  })

  describe('findByUserId', () => {
    it('returns expenses for a user without filters', async () => {
      // Arrange
      const userId = 'user-123'
      const expenses = [createMockExpense(), createMockExpense({ id: 'expense-2' })]
      mocks.mockOrder.mockResolvedValue({ data: expenses, error: null })

      // Act
      const result = await sut.findByUserId(userId)

      // Assert
      expect(result).toEqual(expenses)
      expect(mocks.mockFrom).toHaveBeenCalledWith('expense')
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('applies start_date filter', async () => {
      // Arrange
      const userId = 'user-123'
      const filters: ExpenseFilters = { start_date: '2024-01-01' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.findByUserId(userId, filters)

      // Assert
      expect(mocks.mockGte).toHaveBeenCalledWith('date', '2024-01-01')
    })

    it('applies end_date filter', async () => {
      // Arrange
      const userId = 'user-123'
      const filters: ExpenseFilters = { end_date: '2024-01-31' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.findByUserId(userId, filters)

      // Assert
      expect(mocks.mockLte).toHaveBeenCalledWith('date', '2024-01-31')
    })

    it('applies category_id filter', async () => {
      // Arrange
      const userId = 'user-123'
      const filters: ExpenseFilters = { category_id: 'cat-1' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.findByUserId(userId, filters)

      // Assert
      expect(mocks.mockEq).toHaveBeenCalledWith('category_id', 'cat-1')
    })

    it('applies payment_method filter', async () => {
      // Arrange
      const userId = 'user-123'
      const filters: ExpenseFilters = { payment_method: 'pix' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.findByUserId(userId, filters)

      // Assert
      expect(mocks.mockEq).toHaveBeenCalledWith('payment_method', 'pix')
    })

    it('applies one_time expense_type filter', async () => {
      // Arrange
      const userId = 'user-123'
      const filters: ExpenseFilters = { expense_type: 'one_time' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.findByUserId(userId, filters)

      // Assert
      expect(mocks.mockEq).toHaveBeenCalledWith('is_recurrent', false)
      expect(mocks.mockIs).toHaveBeenCalledWith('installment_total', null)
    })

    it('applies recurrent expense_type filter', async () => {
      // Arrange
      const userId = 'user-123'
      const filters: ExpenseFilters = { expense_type: 'recurrent' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.findByUserId(userId, filters)

      // Assert
      expect(mocks.mockEq).toHaveBeenCalledWith('is_recurrent', true)
    })

    it('applies installment expense_type filter', async () => {
      // Arrange
      const userId = 'user-123'
      const filters: ExpenseFilters = { expense_type: 'installment' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.findByUserId(userId, filters)

      // Assert
      expect(mocks.mockNot).toHaveBeenCalledWith('installment_total', 'is', null)
    })

    it('applies credit_card_id filter', async () => {
      // Arrange
      const userId = 'user-123'
      const filters: ExpenseFilters = { credit_card_id: 'card-1' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.findByUserId(userId, filters)

      // Assert
      expect(mocks.mockEq).toHaveBeenCalledWith('credit_card_id', 'card-1')
    })

    it('applies credit_card_id none filter', async () => {
      // Arrange
      const userId = 'user-123'
      const filters: ExpenseFilters = { credit_card_id: 'none' }
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      await sut.findByUserId(userId, filters)

      // Assert
      expect(mocks.mockIs).toHaveBeenCalledWith('credit_card_id', null)
    })

    it('returns empty array on error', async () => {
      // Arrange
      const userId = 'user-123'
      mocks.mockOrder.mockResolvedValue({ data: null, error: new Error('Query failed') })

      // Act
      const result = await sut.findByUserId(userId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('findByUserIdPaginated', () => {
    it('returns paginated expenses with total count', async () => {
      // Arrange
      const userId = 'user-123'
      const expenses = [createMockExpense()]
      mocks.mockRange.mockResolvedValue({ data: expenses, error: null, count: 50 })

      // Act
      const result = await sut.findByUserIdPaginated(userId)

      // Assert
      expect(result).toEqual({ data: expenses, total: 50 })
      expect(mocks.mockRange).toHaveBeenCalledWith(0, 19)
    })

    it('applies pagination offset correctly', async () => {
      // Arrange
      const userId = 'user-123'
      mocks.mockRange.mockResolvedValue({ data: [], error: null, count: 50 })

      // Act
      await sut.findByUserIdPaginated(userId, undefined, 3, 10)

      // Assert
      expect(mocks.mockRange).toHaveBeenCalledWith(20, 29)
    })

    it('returns empty result on error', async () => {
      // Arrange
      const userId = 'user-123'
      mocks.mockRange.mockResolvedValue({ data: null, error: new Error('Query failed'), count: 0 })

      // Act
      const result = await sut.findByUserIdPaginated(userId)

      // Assert
      expect(result).toEqual({ data: [], total: 0 })
    })

    it('returns zero total when count is null', async () => {
      // Arrange
      const userId = 'user-123'
      mocks.mockRange.mockResolvedValue({ data: [], error: null, count: null })

      // Act
      const result = await sut.findByUserIdPaginated(userId)

      // Assert
      expect(result.total).toBe(0)
    })
  })

  describe('findRecurrentByUserId', () => {
    it('returns recurrent expenses ordered by description', async () => {
      // Arrange
      const userId = 'user-123'
      const recurrentExpenses = [
        createMockExpense({ is_recurrent: true, description: 'A Expense' }),
        createMockExpense({ id: 'exp-2', is_recurrent: true, description: 'B Expense' }),
      ]
      mocks.mockOrder.mockResolvedValue({ data: recurrentExpenses, error: null })

      // Act
      const result = await sut.findRecurrentByUserId(userId)

      // Assert
      expect(result).toEqual(recurrentExpenses)
      expect(mocks.mockEq).toHaveBeenCalledWith('is_recurrent', true)
      expect(mocks.mockOrder).toHaveBeenCalledWith('description')
    })

    it('returns empty array on error', async () => {
      // Arrange
      const userId = 'user-123'
      mocks.mockOrder.mockResolvedValue({ data: null, error: new Error('Query failed') })

      // Act
      const result = await sut.findRecurrentByUserId(userId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('returns expense when found', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      const expense = createMockExpense()
      mocks.mockSingle.mockResolvedValue({ data: expense, error: null })

      // Act
      const result = await sut.findById(expenseId, userId)

      // Assert
      expect(result).toEqual(expense)
      expect(mocks.mockEq).toHaveBeenCalledWith('id', expenseId)
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns null when not found', async () => {
      // Arrange
      const expenseId = 'nonexistent'
      const userId = 'user-123'
      mocks.mockSingle.mockResolvedValue({ data: null, error: null })

      // Act
      const result = await sut.findById(expenseId, userId)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null on error', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      mocks.mockSingle.mockResolvedValue({ data: null, error: new Error('Query failed') })

      // Act
      const result = await sut.findById(expenseId, userId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates and returns expense', async () => {
      // Arrange
      const userId = 'user-123'
      const input: CreateExpenseData = {
        category_id: 'cat-1',
        description: 'New Expense',
        amount_cents: 10000,
        payment_method: 'pix',
        date: '2024-02-01',
      }
      const createdExpense = createMockExpense({ ...input })
      mocks.mockSingle.mockResolvedValue({ data: createdExpense, error: null })

      // Act
      const result = await sut.create(userId, input)

      // Assert
      expect(result).toEqual(createdExpense)
      expect(mocks.mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          category_id: 'cat-1',
          description: 'New Expense',
          amount_cents: 10000,
          payment_method: 'pix',
          date: '2024-02-01',
          is_recurrent: false,
        })
      )
    })

    it('creates expense with recurrent fields', async () => {
      // Arrange
      const userId = 'user-123'
      const input: CreateExpenseData = {
        category_id: 'cat-1',
        description: 'Recurrent Expense',
        amount_cents: 10000,
        payment_method: 'credit_card',
        date: '2024-02-01',
        is_recurrent: true,
        recurrence_day: 15,
        recurrence_start: '2024-02-01',
        recurrence_end: '2024-12-01',
      }
      mocks.mockSingle.mockResolvedValue({ data: createMockExpense(input), error: null })

      // Act
      await sut.create(userId, input)

      // Assert
      expect(mocks.mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_recurrent: true,
          recurrence_day: 15,
          recurrence_start: '2024-02-01',
          recurrence_end: '2024-12-01',
        })
      )
    })

    it('creates expense with installment fields', async () => {
      // Arrange
      const userId = 'user-123'
      const input: CreateExpenseData = {
        category_id: 'cat-1',
        description: 'Installment Expense',
        amount_cents: 3334,
        payment_method: 'credit_card',
        date: '2024-02-01',
        installment_current: 1,
        installment_total: 3,
        installment_group_id: 'group-1',
        credit_card_id: 'card-1',
      }
      mocks.mockSingle.mockResolvedValue({ data: createMockExpense(input), error: null })

      // Act
      await sut.create(userId, input)

      // Assert
      expect(mocks.mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          installment_current: 1,
          installment_total: 3,
          installment_group_id: 'group-1',
          credit_card_id: 'card-1',
        })
      )
    })

    it('returns null on error', async () => {
      // Arrange
      const userId = 'user-123'
      const input: CreateExpenseData = {
        category_id: 'cat-1',
        description: 'New Expense',
        amount_cents: 10000,
        payment_method: 'pix',
        date: '2024-02-01',
      }
      mocks.mockSingle.mockResolvedValue({ data: null, error: new Error('Insert failed') })

      // Act
      const result = await sut.create(userId, input)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('createMany', () => {
    it('creates multiple expenses and returns them', async () => {
      // Arrange
      const userId = 'user-123'
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
      const createdExpenses = inputs.map((input, index) =>
        createMockExpense({ id: `exp-${index}`, ...input })
      )
      mocks.mockSelect.mockResolvedValue({ data: createdExpenses, error: null })

      // Act
      const result = await sut.createMany(userId, inputs)

      // Assert
      expect(result).toEqual(createdExpenses)
      expect(mocks.mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ user_id: userId, installment_current: 1 }),
          expect.objectContaining({ user_id: userId, installment_current: 2 }),
        ])
      )
    })

    it('returns empty array on error', async () => {
      // Arrange
      const userId = 'user-123'
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

      // Act
      const result = await sut.createMany(userId, inputs)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('update', () => {
    it('updates and returns expense', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      const input: UpdateExpense = { description: 'Updated Description', amount_cents: 7500 }
      const updatedExpense = createMockExpense({ ...input })
      mocks.mockSingle.mockResolvedValue({ data: updatedExpense, error: null })

      // Act
      const result = await sut.update(expenseId, userId, input)

      // Assert
      expect(result).toEqual(updatedExpense)
      expect(mocks.mockUpdate).toHaveBeenCalledWith({
        ...input,
        updated_at: expect.any(String),
      })
      expect(mocks.mockEq).toHaveBeenCalledWith('id', expenseId)
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns null when update fails', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      const input: UpdateExpense = { description: 'Updated' }
      mocks.mockSingle.mockResolvedValue({ data: null, error: new Error('Update failed') })

      // Act
      const result = await sut.update(expenseId, userId, input)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null when expense not found', async () => {
      // Arrange
      const expenseId = 'nonexistent'
      const userId = 'user-123'
      const input: UpdateExpense = { description: 'Updated' }
      mocks.mockSingle.mockResolvedValue({ data: null, error: null })

      // Act
      const result = await sut.update(expenseId, userId, input)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('returns true when expense is deleted', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 1 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      const result = await sut.delete(expenseId, userId)

      // Assert
      expect(result).toBe(true)
      expect(mocks.mockDelete).toHaveBeenCalledWith({ count: 'exact' })
      expect(mocks.mockDeleteEq).toHaveBeenCalledWith('id', expenseId)
      expect(mockSecondEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns false when expense not found', async () => {
      // Arrange
      const expenseId = 'nonexistent'
      const userId = 'user-123'
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 0 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      const result = await sut.delete(expenseId, userId)

      // Assert
      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      const mockSecondEq = vi
        .fn()
        .mockResolvedValue({ error: new Error('Delete failed'), count: 0 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      const result = await sut.delete(expenseId, userId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('deleteByGroupId', () => {
    it('returns true when installments are deleted', async () => {
      // Arrange
      const groupId = 'group-1'
      const userId = 'user-123'
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 3 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      const result = await sut.deleteByGroupId(groupId, userId)

      // Assert
      expect(result).toBe(true)
      expect(mocks.mockDeleteEq).toHaveBeenCalledWith('installment_group_id', groupId)
      expect(mockSecondEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns false when no installments found', async () => {
      // Arrange
      const groupId = 'nonexistent'
      const userId = 'user-123'
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 0 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      const result = await sut.deleteByGroupId(groupId, userId)

      // Assert
      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      // Arrange
      const groupId = 'group-1'
      const userId = 'user-123'
      const mockSecondEq = vi
        .fn()
        .mockResolvedValue({ error: new Error('Delete failed'), count: 0 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      const result = await sut.deleteByGroupId(groupId, userId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('findByGroupId', () => {
    it('returns expenses for installment group ordered by installment_current', async () => {
      // Arrange
      const groupId = 'group-1'
      const userId = 'user-123'
      const installments = [
        createMockExpense({
          installment_current: 1,
          installment_total: 3,
          installment_group_id: groupId,
        }),
        createMockExpense({
          id: 'exp-2',
          installment_current: 2,
          installment_total: 3,
          installment_group_id: groupId,
        }),
        createMockExpense({
          id: 'exp-3',
          installment_current: 3,
          installment_total: 3,
          installment_group_id: groupId,
        }),
      ]
      mocks.mockOrder.mockResolvedValue({ data: installments, error: null })

      // Act
      const result = await sut.findByGroupId(groupId, userId)

      // Assert
      expect(result).toEqual(installments)
      expect(mocks.mockEq).toHaveBeenCalledWith('installment_group_id', groupId)
      expect(mocks.mockEq).toHaveBeenCalledWith('user_id', userId)
      expect(mocks.mockOrder).toHaveBeenCalledWith('installment_current', { ascending: true })
    })

    it('returns empty array on error', async () => {
      // Arrange
      const groupId = 'group-1'
      const userId = 'user-123'
      mocks.mockOrder.mockResolvedValue({ data: null, error: new Error('Query failed') })

      // Act
      const result = await sut.findByGroupId(groupId, userId)

      // Assert
      expect(result).toEqual([])
    })

    it('returns empty array when no installments found', async () => {
      // Arrange
      const groupId = 'nonexistent'
      const userId = 'user-123'
      mocks.mockOrder.mockResolvedValue({ data: [], error: null })

      // Act
      const result = await sut.findByGroupId(groupId, userId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('updateByGroupId', () => {
    it('updates all expenses in a group and returns count', async () => {
      // Arrange
      const groupId = 'group-1'
      const userId = 'user-123'
      const input = { credit_card_id: 'card-1' }
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 12 })
      mocks.mockEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      const result = await sut.updateByGroupId(groupId, userId, input)

      // Assert
      expect(result).toBe(12)
      expect(mocks.mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          credit_card_id: 'card-1',
          updated_at: expect.any(String),
        })
      )
      expect(mocks.mockEq).toHaveBeenCalledWith('installment_group_id', groupId)
      expect(mockSecondEq).toHaveBeenCalledWith('user_id', userId)
    })

    it('returns 0 on error', async () => {
      // Arrange
      const groupId = 'group-1'
      const userId = 'user-123'
      const input = { credit_card_id: 'card-1' }
      const mockSecondEq = vi
        .fn()
        .mockResolvedValue({ error: new Error('Update failed'), count: 0 })
      mocks.mockEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      const result = await sut.updateByGroupId(groupId, userId, input)

      // Assert
      expect(result).toBe(0)
    })

    it('returns 0 when no expenses found in group', async () => {
      // Arrange
      const groupId = 'nonexistent'
      const userId = 'user-123'
      const input = { credit_card_id: 'card-1' }
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 0 })
      mocks.mockEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      const result = await sut.updateByGroupId(groupId, userId, input)

      // Assert
      expect(result).toBe(0)
    })
  })

  describe('cache invalidation', () => {
    let mockCacheInvalidate: CacheInvalidationFn
    let sutWithCache: ExpensesRepository

    beforeEach(() => {
      mockCacheInvalidate = vi.fn().mockResolvedValue(undefined)
      sutWithCache = new ExpensesRepository(mocks.supabase, mockCacheInvalidate)
    })

    it('calls cache invalidation after successful create', async () => {
      // Arrange
      const userId = 'user-123'
      const input: CreateExpenseData = {
        category_id: 'cat-1',
        description: 'New Expense',
        amount_cents: 10000,
        payment_method: 'pix',
        date: '2024-02-01',
      }
      mocks.mockSingle.mockResolvedValue({ data: createMockExpense(input), error: null })

      // Act
      await sutWithCache.create(userId, input)

      // Assert
      expect(mockCacheInvalidate).toHaveBeenCalledWith(userId)
    })

    it('does not call cache invalidation on failed create', async () => {
      // Arrange
      const userId = 'user-123'
      const input: CreateExpenseData = {
        category_id: 'cat-1',
        description: 'New Expense',
        amount_cents: 10000,
        payment_method: 'pix',
        date: '2024-02-01',
      }
      mocks.mockSingle.mockResolvedValue({ data: null, error: new Error('Insert failed') })

      // Act
      await sutWithCache.create(userId, input)

      // Assert
      expect(mockCacheInvalidate).not.toHaveBeenCalled()
    })

    it('calls cache invalidation after successful createMany', async () => {
      // Arrange
      const userId = 'user-123'
      const inputs: CreateExpenseData[] = [
        {
          category_id: 'cat-1',
          description: 'Test',
          amount_cents: 1000,
          payment_method: 'pix',
          date: '2024-01-01',
        },
      ]
      mocks.mockSelect.mockResolvedValue({ data: [createMockExpense()], error: null })

      // Act
      await sutWithCache.createMany(userId, inputs)

      // Assert
      expect(mockCacheInvalidate).toHaveBeenCalledWith(userId)
    })

    it('does not call cache invalidation on failed createMany', async () => {
      // Arrange
      const userId = 'user-123'
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

      // Act
      await sutWithCache.createMany(userId, inputs)

      // Assert
      expect(mockCacheInvalidate).not.toHaveBeenCalled()
    })

    it('calls cache invalidation after successful update', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      const input: UpdateExpense = { description: 'Updated' }
      mocks.mockSingle.mockResolvedValue({ data: createMockExpense(input), error: null })

      // Act
      await sutWithCache.update(expenseId, userId, input)

      // Assert
      expect(mockCacheInvalidate).toHaveBeenCalledWith(userId)
    })

    it('does not call cache invalidation on failed update', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      const input: UpdateExpense = { description: 'Updated' }
      mocks.mockSingle.mockResolvedValue({ data: null, error: new Error('Update failed') })

      // Act
      await sutWithCache.update(expenseId, userId, input)

      // Assert
      expect(mockCacheInvalidate).not.toHaveBeenCalled()
    })

    it('calls cache invalidation after successful delete', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 1 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      await sutWithCache.delete(expenseId, userId)

      // Assert
      expect(mockCacheInvalidate).toHaveBeenCalledWith(userId)
    })

    it('does not call cache invalidation on failed delete', async () => {
      // Arrange
      const expenseId = 'expense-1'
      const userId = 'user-123'
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 0 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      await sutWithCache.delete(expenseId, userId)

      // Assert
      expect(mockCacheInvalidate).not.toHaveBeenCalled()
    })

    it('calls cache invalidation after successful deleteByGroupId', async () => {
      // Arrange
      const groupId = 'group-1'
      const userId = 'user-123'
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 3 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      await sutWithCache.deleteByGroupId(groupId, userId)

      // Assert
      expect(mockCacheInvalidate).toHaveBeenCalledWith(userId)
    })

    it('does not call cache invalidation on failed deleteByGroupId', async () => {
      // Arrange
      const groupId = 'group-1'
      const userId = 'user-123'
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null, count: 0 })
      mocks.mockDeleteEq.mockReturnValue({ eq: mockSecondEq })

      // Act
      await sutWithCache.deleteByGroupId(groupId, userId)

      // Assert
      expect(mockCacheInvalidate).not.toHaveBeenCalled()
    })

    it('works without cache invalidation callback', async () => {
      // Arrange - using sut without cache callback
      const userId = 'user-123'
      const input: CreateExpenseData = {
        category_id: 'cat-1',
        description: 'New Expense',
        amount_cents: 10000,
        payment_method: 'pix',
        date: '2024-02-01',
      }
      mocks.mockSingle.mockResolvedValue({ data: createMockExpense(input), error: null })

      // Act & Assert - should not throw
      const result = await sut.create(userId, input)
      expect(result).not.toBeNull()
    })
  })
})
