import type { CreateSalary } from '@plim/shared'
import { createMockSalaryHistory } from '@plim/shared/test-utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SalaryRepository } from './salary.repository'

type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
}

function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  }
}

describe('SalaryRepository', () => {
  let sut: SalaryRepository
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    sut = new SalaryRepository(mockSupabase as unknown as SupabaseClient)
  })

  describe('findActiveForMonth', () => {
    it('returns salary effective for the given month', async () => {
      const salary = createMockSalaryHistory()
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

      const result = await sut.findActiveForMonth('user-123', '2026-01')

      expect(result).toEqual(salary)
    })

    it('returns null when no salary exists for the month', async () => {
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

      const result = await sut.findActiveForMonth('user-123', '2025-01')

      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
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

      const result = await sut.findActiveForMonth('user-123', '2026-01')

      expect(result).toBeNull()
    })
  })

  describe('findAllByUserId', () => {
    it('returns all salary entries for user', async () => {
      const salaries = [
        createMockSalaryHistory({ effective_from: '2026-01-01', amount_cents: 600000 }),
        createMockSalaryHistory({ effective_from: '2025-06-01', amount_cents: 500000 }),
        createMockSalaryHistory({ effective_from: '2025-01-01', amount_cents: 400000 }),
      ]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: salaries, error: null }),
          }),
        }),
      })

      const result = await sut.findAllByUserId('user-123')

      expect(result).toEqual(salaries)
      expect(result).toHaveLength(3)
    })

    it('returns empty array when user has no salary history', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      const result = await sut.findAllByUserId('user-123')

      expect(result).toEqual([])
    })

    it('returns empty array on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          }),
        }),
      })

      const result = await sut.findAllByUserId('user-123')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('creates salary entry via RPC and returns result', async () => {
      const input: CreateSalary = {
        amount_cents: 550000,
        effective_from: '2026-02-01',
      }
      const createdSalary = createMockSalaryHistory({
        amount_cents: 550000,
        effective_from: '2026-02-01',
      })
      mockSupabase.rpc.mockResolvedValue({ data: createdSalary, error: null })

      const result = await sut.create('user-123', input)

      expect(result).toEqual(createdSalary)
    })

    it('returns null when RPC fails', async () => {
      const input: CreateSalary = {
        amount_cents: 550000,
        effective_from: '2026-02-01',
      }
      mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC error') })

      const result = await sut.create('user-123', input)

      expect(result).toBeNull()
    })

    it('returns null when RPC returns null data', async () => {
      const input: CreateSalary = {
        amount_cents: 550000,
        effective_from: '2026-02-01',
      }
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await sut.create('user-123', input)

      expect(result).toBeNull()
    })
  })
})
