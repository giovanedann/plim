import { createMockInvoice, resetIdCounter } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRemainderExpenseIfNeeded } from './create-remainder-expense'
import type { InvoicesRepository } from './invoices.repository'

type MockRepository = {
  findRemainderExpense: ReturnType<typeof vi.fn>
  createRemainderExpense: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findRemainderExpense: vi.fn(),
    createRemainderExpense: vi.fn(),
  }
}

describe('createRemainderExpenseIfNeeded', () => {
  const sut = createRemainderExpenseIfNeeded
  let mockRepository: MockRepository

  beforeEach(() => {
    resetIdCounter()
    mockRepository = createMockRepository()
  })

  it('creates remainder expense when invoice has unpaid balance', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      credit_card_id: 'card-1',
      reference_month: '2026-01',
      total_amount_cents: 100000,
      carry_over_cents: 20000,
      paid_amount_cents: 50000,
      status: 'open',
      cycle_end: '2026-01-09',
    })

    mockRepository.findRemainderExpense.mockResolvedValue(null)
    mockRepository.createRemainderExpense.mockResolvedValue(null)

    await sut({
      invoice,
      creditCardName: 'Nubank',
      userId: 'user-123',
      repository: mockRepository as unknown as InvoicesRepository,
    })

    expect(mockRepository.createRemainderExpense).toHaveBeenCalledWith(
      'user-123',
      'invoice-1',
      'card-1',
      70000,
      expect.any(String),
      '2026-01-09'
    )
  })

  it('skips creation when invoice is fully paid', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      total_amount_cents: 100000,
      paid_amount_cents: 100000,
      carry_over_cents: 0,
      status: 'paid',
    })

    await sut({
      invoice,
      creditCardName: 'Nubank',
      userId: 'user-123',
      repository: mockRepository as unknown as InvoicesRepository,
    })

    expect(mockRepository.findRemainderExpense).not.toHaveBeenCalled()
    expect(mockRepository.createRemainderExpense).not.toHaveBeenCalled()
  })

  it('skips creation when remaining is zero', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      total_amount_cents: 80000,
      carry_over_cents: 20000,
      paid_amount_cents: 100000,
      status: 'open',
    })

    await sut({
      invoice,
      creditCardName: 'Nubank',
      userId: 'user-123',
      repository: mockRepository as unknown as InvoicesRepository,
    })

    expect(mockRepository.findRemainderExpense).not.toHaveBeenCalled()
    expect(mockRepository.createRemainderExpense).not.toHaveBeenCalled()
  })

  it('skips creation when remainder already exists (idempotency)', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      total_amount_cents: 100000,
      carry_over_cents: 0,
      paid_amount_cents: 50000,
      status: 'open',
    })

    mockRepository.findRemainderExpense.mockResolvedValue({
      id: 'existing-expense',
      amount_cents: 50000,
    })

    await sut({
      invoice,
      creditCardName: 'Nubank',
      userId: 'user-123',
      repository: mockRepository as unknown as InvoicesRepository,
    })

    expect(mockRepository.findRemainderExpense).toHaveBeenCalledWith('invoice-1', 'user-123')
    expect(mockRepository.createRemainderExpense).not.toHaveBeenCalled()
  })

  it('generates correct description with Portuguese month name', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      credit_card_id: 'card-1',
      reference_month: '2026-01',
      total_amount_cents: 100000,
      carry_over_cents: 0,
      paid_amount_cents: 50000,
      status: 'open',
      cycle_end: '2026-01-09',
    })

    mockRepository.findRemainderExpense.mockResolvedValue(null)
    mockRepository.createRemainderExpense.mockResolvedValue(null)

    await sut({
      invoice,
      creditCardName: 'Nubank',
      userId: 'user-123',
      repository: mockRepository as unknown as InvoicesRepository,
    })

    expect(mockRepository.createRemainderExpense).toHaveBeenCalledWith(
      'user-123',
      'invoice-1',
      'card-1',
      50000,
      'Restante da Fatura de Janeiro - Nubank',
      '2026-01-09'
    )
  })

  it('uses cycle_end as expense date', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      credit_card_id: 'card-1',
      reference_month: '2026-03',
      total_amount_cents: 200000,
      carry_over_cents: 10000,
      paid_amount_cents: 100000,
      status: 'open',
      cycle_end: '2026-03-15',
    })

    mockRepository.findRemainderExpense.mockResolvedValue(null)
    mockRepository.createRemainderExpense.mockResolvedValue(null)

    await sut({
      invoice,
      creditCardName: 'Inter',
      userId: 'user-123',
      repository: mockRepository as unknown as InvoicesRepository,
    })

    expect(mockRepository.createRemainderExpense).toHaveBeenCalledWith(
      'user-123',
      'invoice-1',
      'card-1',
      110000,
      'Restante da Fatura de Março - Inter',
      '2026-03-15'
    )
  })
})
