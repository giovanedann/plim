import type { CreateSalary, SalaryHistory } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SalaryRepository } from './salary.repository'

function createMockSalary(overrides: Partial<SalaryHistory> = {}): SalaryHistory {
  return {
    id: 'salary-123',
    user_id: 'user-123',
    amount_cents: 500000,
    effective_from: '2026-01-01',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function createMockSupabaseClient() {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  }
}

describe('SalaryRepository', () => {
  let sut: SalaryRepository
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    sut = new SalaryRepository(mockSupabase as unknown as SupabaseClient)
  })

  describe('findActiveForMonth', () => {
    it('returns salary effective for the given month', async () => {
      // Arrange
      const salary = createMockSalary()

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: salary, error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findActiveForMonth('user-123', '2026-01')

      // Assert
      expect(result).toEqual(salary)
      expect(mockSupabase.from).toHaveBeenCalledWith('salary_history')
    })

    it('returns null when no salary exists for the month', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findActiveForMonth('user-123', '2025-01')

      // Assert
      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findActiveForMonth('user-123', '2026-01')

      // Assert
      expect(result).toBeNull()
    })

    it('returns most recent salary before or on first day of month', async () => {
      // Arrange
      const salary = createMockSalary({ effective_from: '2025-06-01' })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: salary, error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      // Act
      const result = await sut.findActiveForMonth('user-123', '2026-02')

      // Assert
      expect(result).toEqual(salary)
    })
  })

  describe('findAllByUserId', () => {
    it('returns all salary entries for user', async () => {
      // Arrange
      const salaries = [
        createMockSalary({ id: 'salary-1', effective_from: '2026-01-01', amount_cents: 600000 }),
        createMockSalary({ id: 'salary-2', effective_from: '2025-06-01', amount_cents: 500000 }),
        createMockSalary({ id: 'salary-3', effective_from: '2025-01-01', amount_cents: 400000 }),
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: salaries, error: null }),
          }),
        }),
      })

      // Act
      const result = await sut.findAllByUserId('user-123')

      // Assert
      expect(result).toEqual(salaries)
      expect(result).toHaveLength(3)
      expect(mockSupabase.from).toHaveBeenCalledWith('salary_history')
    })

    it('returns empty array when user has no salary history', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      // Act
      const result = await sut.findAllByUserId('user-123')

      // Assert
      expect(result).toEqual([])
    })

    it('returns empty array on database error', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          }),
        }),
      })

      // Act
      const result = await sut.findAllByUserId('user-123')

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('creates salary entry via RPC and returns result', async () => {
      // Arrange
      const input: CreateSalary = {
        amount_cents: 550000,
        effective_from: '2026-02-01',
      }
      const createdSalary = createMockSalary({
        amount_cents: 550000,
        effective_from: '2026-02-01',
      })

      mockSupabase.rpc.mockResolvedValue({ data: createdSalary, error: null })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toEqual(createdSalary)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_salary', {
        p_user_id: 'user-123',
        p_amount_cents: 550000,
        p_effective_from: '2026-02-01',
      })
    })

    it('returns null when RPC fails', async () => {
      // Arrange
      const input: CreateSalary = {
        amount_cents: 550000,
        effective_from: '2026-02-01',
      }

      mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC error') })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toBeNull()
    })

    it('returns null when RPC returns null data', async () => {
      // Arrange
      const input: CreateSalary = {
        amount_cents: 550000,
        effective_from: '2026-02-01',
      }

      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toBeNull()
    })

    it('upserts salary for existing effective_from date', async () => {
      // Arrange
      const input: CreateSalary = {
        amount_cents: 600000,
        effective_from: '2026-01-01',
      }
      const updatedSalary = createMockSalary({
        amount_cents: 600000,
        effective_from: '2026-01-01',
      })

      mockSupabase.rpc.mockResolvedValue({ data: updatedSalary, error: null })

      // Act
      const result = await sut.create('user-123', input)

      // Assert
      expect(result).toEqual(updatedSalary)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_salary', {
        p_user_id: 'user-123',
        p_amount_cents: 600000,
        p_effective_from: '2026-01-01',
      })
    })
  })
})
