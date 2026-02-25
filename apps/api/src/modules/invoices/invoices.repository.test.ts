import type { CreateInvoice, UpdateInvoice } from '@plim/shared'
import { createMockExpense, createMockInvoice } from '@plim/shared/test-utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InvoicesRepository } from './invoices.repository'

type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn>
}

function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: vi.fn(),
  }
}

describe('InvoicesRepository', () => {
  let sut: InvoicesRepository
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    sut = new InvoicesRepository(mockSupabase as unknown as SupabaseClient)
  })

  describe('findByCardAndMonth', () => {
    it('returns invoice when found', async () => {
      const invoice = createMockInvoice()
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: invoice, error: null }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.findByCardAndMonth('card-123', 'user-123', '2026-01')

      expect(result).toEqual(invoice)
      expect(mockSupabase.from).toHaveBeenCalledWith('invoice')
    })

    it('returns null when not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.findByCardAndMonth('card-123', 'user-123', '2026-01')

      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.findByCardAndMonth('card-123', 'user-123', '2026-01')

      expect(result).toBeNull()
    })
  })

  describe('findByCard', () => {
    it('returns invoices for card ordered by reference_month desc', async () => {
      const invoices = [
        createMockInvoice({ reference_month: '2026-02' }),
        createMockInvoice({ reference_month: '2026-01' }),
      ]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: invoices, error: null }),
            }),
          }),
        }),
      })

      const result = await sut.findByCard('card-123', 'user-123')

      expect(result).toEqual(invoices)
      expect(result).toHaveLength(2)
    })

    it('returns empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            }),
          }),
        }),
      })

      const result = await sut.findByCard('card-123', 'user-123')

      expect(result).toEqual([])
    })

    it('returns empty array when no invoices exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      })

      const result = await sut.findByCard('card-123', 'user-123')

      expect(result).toEqual([])
    })
  })

  describe('findUnpaidByCard', () => {
    it('returns unpaid invoices for card', async () => {
      const invoices = [
        createMockInvoice({ status: 'open', reference_month: '2026-02' }),
        createMockInvoice({ status: 'partially_paid', reference_month: '2026-01' }),
      ]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: invoices, error: null }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.findUnpaidByCard('card-123', 'user-123')

      expect(result).toEqual(invoices)
      expect(result).toHaveLength(2)
    })

    it('returns empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.findUnpaidByCard('card-123', 'user-123')

      expect(result).toEqual([])
    })

    it('returns empty array when all invoices are paid', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.findUnpaidByCard('card-123', 'user-123')

      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('returns invoice when found', async () => {
      const invoice = createMockInvoice()
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: invoice, error: null }),
            }),
          }),
        }),
      })

      const result = await sut.findById('invoice-123', 'user-123')

      expect(result).toEqual(invoice)
    })

    it('returns null when not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      })

      const result = await sut.findById('non-existent', 'user-123')

      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            }),
          }),
        }),
      })

      const result = await sut.findById('invoice-123', 'user-123')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates and returns new invoice', async () => {
      const input: CreateInvoice = {
        credit_card_id: '00000000-0000-4000-8000-000000000003',
        reference_month: '2026-01',
        cycle_start: '2025-12-10',
        cycle_end: '2026-01-09',
        total_amount_cents: 150000,
        paid_amount_cents: 0,
        carry_over_cents: 0,
        status: 'open',
      }
      const createdInvoice = createMockInvoice(input)
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdInvoice, error: null }),
          }),
        }),
      })

      const result = await sut.create('user-123', input)

      expect(result).toEqual(createdInvoice)
    })

    it('creates invoice with zero paid and carry-over amounts', async () => {
      const input: CreateInvoice = {
        credit_card_id: '00000000-0000-4000-8000-000000000003',
        reference_month: '2026-01',
        cycle_start: '2025-12-10',
        cycle_end: '2026-01-09',
        total_amount_cents: 150000,
        paid_amount_cents: 0,
        carry_over_cents: 0,
        status: 'open',
      }
      const createdInvoice = createMockInvoice(input)
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdInvoice, error: null }),
          }),
        }),
      })

      const result = await sut.create('user-123', input)

      expect(result).toEqual(createdInvoice)
      expect(result?.paid_amount_cents).toBe(0)
      expect(result?.carry_over_cents).toBe(0)
      expect(result?.status).toBe('open')
    })

    it('returns null on creation error', async () => {
      const input: CreateInvoice = {
        credit_card_id: '00000000-0000-4000-8000-000000000003',
        reference_month: '2026-01',
        cycle_start: '2025-12-10',
        cycle_end: '2026-01-09',
        total_amount_cents: 150000,
        paid_amount_cents: 0,
        carry_over_cents: 0,
        status: 'open',
      }
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      })

      const result = await sut.create('user-123', input)

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('updates and returns invoice', async () => {
      const input: UpdateInvoice = {
        paid_amount_cents: 50000,
        status: 'partially_paid',
      }
      const updatedInvoice = createMockInvoice({
        paid_amount_cents: 50000,
        status: 'partially_paid',
      })
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedInvoice, error: null }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.update('invoice-123', 'user-123', input)

      expect(result).toEqual(updatedInvoice)
    })

    it('returns null when invoice not found', async () => {
      const input: UpdateInvoice = { status: 'paid' }
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

      const result = await sut.update('non-existent', 'user-123', input)

      expect(result).toBeNull()
    })

    it('returns null on update error', async () => {
      const input: UpdateInvoice = { status: 'paid' }
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

      const result = await sut.update('invoice-123', 'user-123', input)

      expect(result).toBeNull()
    })
  })

  describe('sumFutureInstallments', () => {
    it('returns sum of future installment amounts', async () => {
      const rows = [{ amount_cents: 10000 }, { amount_cents: 10000 }, { amount_cents: 10000 }]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  not: vi.fn().mockResolvedValue({ data: rows, error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.sumFutureInstallments('card-123', 'user-123', '2026-01-10')

      expect(result).toBe(30000)
      expect(mockSupabase.from).toHaveBeenCalledWith('expense')
    })

    it('returns 0 when no future installments exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  not: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.sumFutureInstallments('card-123', 'user-123', '2026-01-10')

      expect(result).toBe(0)
    })

    it('returns 0 on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  not: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
                }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.sumFutureInstallments('card-123', 'user-123', '2026-01-10')

      expect(result).toBe(0)
    })
  })

  describe('sumActiveRecurrences', () => {
    it('deduplicates by recurrent_group_id and returns sum', async () => {
      const rows = [
        { amount_cents: 5000, recurrent_group_id: 'group-1' },
        { amount_cents: 5000, recurrent_group_id: 'group-1' },
        { amount_cents: 3000, recurrent_group_id: 'group-2' },
      ]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({ data: rows, error: null }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.sumActiveRecurrences('card-123', 'user-123', '2026-01-15')

      expect(result).toBe(8000)
    })

    it('returns 0 when no active recurrences exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.sumActiveRecurrences('card-123', 'user-123', '2026-01-15')

      expect(result).toBe(0)
    })

    it('returns 0 on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.sumActiveRecurrences('card-123', 'user-123', '2026-01-15')

      expect(result).toBe(0)
    })
  })

  describe('getTransactionsForCycle', () => {
    it('returns expenses for the billing cycle', async () => {
      const expenses = [
        createMockExpense({
          credit_card_id: 'card-123',
          date: '2025-12-15',
          type: 'expense',
        }),
        createMockExpense({
          credit_card_id: 'card-123',
          date: '2026-01-05',
          type: 'expense',
        }),
      ]
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: expenses, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.getTransactionsForCycle(
        'card-123',
        'user-123',
        '2025-12-10',
        '2026-01-09'
      )

      expect(result).toEqual(expenses)
      expect(result).toHaveLength(2)
      expect(mockSupabase.from).toHaveBeenCalledWith('expense')
    })

    it('returns empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.getTransactionsForCycle(
        'card-123',
        'user-123',
        '2025-12-10',
        '2026-01-09'
      )

      expect(result).toEqual([])
    })

    it('returns empty array when no transactions in cycle', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const result = await sut.getTransactionsForCycle(
        'card-123',
        'user-123',
        '2025-12-10',
        '2026-01-09'
      )

      expect(result).toEqual([])
    })
  })
})
