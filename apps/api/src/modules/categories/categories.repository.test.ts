import type { CreateCategory, UpdateCategory } from '@plim/shared'
import { createMockCategory } from '@plim/shared/test-utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CategoriesRepository } from './categories.repository'

function createMockSupabaseClient() {
  const mockSingle = vi.fn()
  const mockOrder = vi.fn(() => ({ data: [], error: null }))
  const mockEq = vi.fn(() => ({
    single: mockSingle,
    eq: mockEq,
    or: vi.fn(() => ({ single: mockSingle })),
    order: mockOrder,
    select: vi.fn(() => ({ single: mockSingle })),
  }))
  const mockOr = vi.fn(() => ({
    eq: mockEq,
    single: mockSingle,
  }))
  const mockSelect = vi.fn(() => ({
    or: mockOr,
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
  }))
  const mockInsert = vi.fn(() => ({
    select: mockSelect,
  }))
  const mockUpdate = vi.fn(() => ({
    eq: mockEq,
  }))

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  }))

  return {
    from: mockFrom,
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      or: mockOr,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
      insert: mockInsert,
      update: mockUpdate,
    },
  }
}

describe('CategoriesRepository', () => {
  let sut: CategoriesRepository
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    sut = new CategoriesRepository(mockSupabase as unknown as SupabaseClient)
  })

  describe('findByUserId', () => {
    it('returns categories for user including system categories', async () => {
      const systemCategory = createMockCategory({ user_id: null, name: 'System' })
      const userCategory = createMockCategory({ user_id: 'user-123', name: 'Custom' })
      const expectedCategories = [systemCategory, userCategory]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: expectedCategories, error: null }),
            }),
          }),
        }),
      })

      const result = await sut.findByUserId('user-123')

      expect(result).toEqual(expectedCategories)
    })

    it('returns empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            }),
          }),
        }),
      })

      const result = await sut.findByUserId('user-123')

      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('returns category when found', async () => {
      // Arrange
      const category = createMockCategory()

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: category, error: null }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findById('category-123', 'user-123')

      // Assert
      expect(result).toEqual(category)
      expect(mockSupabase.from).toHaveBeenCalledWith('category')
    })

    it('returns null when category not found', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findById('non-existent', 'user-123')

      // Assert
      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findById('category-123', 'user-123')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates and returns new category', async () => {
      // Arrange
      const input: CreateCategory = { name: 'New Category', icon: '🎯', color: '#FF5733' }
      const createdCategory = createMockCategory({ name: 'New Category' })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdCategory, error: null }),
          }),
        }),
      })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toEqual(createdCategory)
      expect(mockSupabase.from).toHaveBeenCalledWith('category')
    })

    it('creates category with null icon and color', async () => {
      // Arrange
      const input: CreateCategory = { name: 'Minimal Category', icon: null, color: null }
      const createdCategory = createMockCategory({
        name: 'Minimal Category',
        icon: null,
        color: null,
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdCategory, error: null }),
          }),
        }),
      })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toEqual(createdCategory)
    })

    it('returns null on creation error', async () => {
      // Arrange
      const input: CreateCategory = { name: 'New Category', icon: null, color: null }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('updates and returns category', async () => {
      // Arrange
      const input: UpdateCategory = { name: 'Updated Name', color: '#00FF00' }
      const updatedCategory = createMockCategory({ name: 'Updated Name', color: '#00FF00' })

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedCategory, error: null }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.update('category-123', 'user-123', input)

      // Assert
      expect(result).toEqual(updatedCategory)
      expect(mockSupabase.from).toHaveBeenCalledWith('category')
    })

    it('returns null when category not found', async () => {
      // Arrange
      const input: UpdateCategory = { name: 'Updated Name' }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.update('non-existent', 'user-123', input)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null on update error', async () => {
      // Arrange
      const input: UpdateCategory = { name: 'Updated Name' }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: null, error: new Error('Update failed') }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.update('category-123', 'user-123', input)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('softDelete', () => {
    it('returns true on successful soft delete', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: 1 }),
          }),
        }),
      })

      // Act
      const result = await sut.softDelete('category-123', 'user-123')

      // Assert
      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('category')
    })

    it('returns false when category not found', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: 0 }),
          }),
        }),
      })

      // Act
      const result = await sut.softDelete('non-existent', 'user-123')

      // Assert
      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed'), count: null }),
          }),
        }),
      })

      // Act
      const result = await sut.softDelete('category-123', 'user-123')

      // Assert
      expect(result).toBe(false)
    })

    it('returns false when count is null', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null, count: null }),
          }),
        }),
      })

      // Act
      const result = await sut.softDelete('category-123', 'user-123')

      // Assert
      expect(result).toBe(false)
    })
  })
})
