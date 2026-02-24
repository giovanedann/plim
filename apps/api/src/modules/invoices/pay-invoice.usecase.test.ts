import { ERROR_CODES, HTTP_STATUS, createMockInvoice, resetIdCounter } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { InvoicesRepository } from './invoices.repository'
import { PayInvoiceUseCase } from './pay-invoice.usecase'

type MockRepository = {
  findById: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  findByCardAndMonth: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findById: vi.fn(),
    update: vi.fn(),
    findByCardAndMonth: vi.fn(),
  }
}

describe('PayInvoiceUseCase', () => {
  let sut: PayInvoiceUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    resetIdCounter()
    mockRepository = createMockRepository()
    sut = new PayInvoiceUseCase(mockRepository as unknown as InvoicesRepository)
  })

  it('processes full payment and sets status to paid', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      total_amount_cents: 100000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })
    const updatedInvoice = {
      ...invoice,
      paid_amount_cents: 100000,
      status: 'paid',
      paid_at: '2026-01-15T12:00:00.000Z',
    }

    mockRepository.findById.mockResolvedValue(invoice)
    mockRepository.update.mockResolvedValue(updatedInvoice)
    mockRepository.findByCardAndMonth.mockResolvedValue(null)

    const result = await sut.execute('user-123', 'invoice-1', 100000)

    expect(result.paid_amount_cents).toBe(100000)
    expect(result.status).toBe('paid')
    expect(result.paid_at).not.toBeNull()
    expect(mockRepository.update).toHaveBeenCalledWith('invoice-1', 'user-123', {
      paid_amount_cents: 100000,
      status: 'paid',
      paid_at: expect.any(String),
    })
  })

  it('processes partial payment and sets status to partially_paid', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      total_amount_cents: 100000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })
    const updatedInvoice = {
      ...invoice,
      paid_amount_cents: 50000,
      status: 'partially_paid',
    }

    mockRepository.findById.mockResolvedValue(invoice)
    mockRepository.update.mockResolvedValue(updatedInvoice)
    mockRepository.findByCardAndMonth.mockResolvedValue(null)

    const result = await sut.execute('user-123', 'invoice-1', 50000)

    expect(result.paid_amount_cents).toBe(50000)
    expect(result.status).toBe('partially_paid')
    expect(mockRepository.update).toHaveBeenCalledWith('invoice-1', 'user-123', {
      paid_amount_cents: 50000,
      status: 'partially_paid',
      paid_at: undefined,
    })
  })

  it('rejects overpayment with VALIDATION_ERROR', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      total_amount_cents: 100000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })

    mockRepository.findById.mockResolvedValue(invoice)

    await expect(sut.execute('user-123', 'invoice-1', 100001)).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'invoice-1', 100001)).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      status: HTTP_STATUS.BAD_REQUEST,
    })

    expect(mockRepository.update).not.toHaveBeenCalled()
  })

  it('recalculates carry-over for next month invoice', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      credit_card_id: 'card-1',
      reference_month: '2026-01',
      total_amount_cents: 100000,
      paid_amount_cents: 0,
      carry_over_cents: 20000,
      status: 'open',
    })
    const nextInvoice = createMockInvoice({
      id: 'invoice-2',
      user_id: 'user-123',
      credit_card_id: 'card-1',
      reference_month: '2026-02',
      carry_over_cents: 120000,
    })
    const updatedInvoice = {
      ...invoice,
      paid_amount_cents: 60000,
      status: 'partially_paid',
    }

    mockRepository.findById.mockResolvedValue(invoice)
    mockRepository.update.mockResolvedValueOnce(updatedInvoice)
    mockRepository.findByCardAndMonth.mockResolvedValue(nextInvoice)
    mockRepository.update.mockResolvedValueOnce({ ...nextInvoice, carry_over_cents: 60000 })

    await sut.execute('user-123', 'invoice-1', 60000)

    // effective_total = 100000 + 20000 = 120000
    // new remaining = 120000 - 60000 = 60000
    expect(mockRepository.findByCardAndMonth).toHaveBeenCalledWith('card-1', 'user-123', '2026-02')
    expect(mockRepository.update).toHaveBeenCalledTimes(2)
    expect(mockRepository.update).toHaveBeenNthCalledWith(2, 'invoice-2', 'user-123', {
      carry_over_cents: 60000,
    })
  })

  it('throws NOT_FOUND when invoice does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'invoice-1', 50000)).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'invoice-1', 50000)).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('includes carry_over_cents in effective total for payment validation', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      total_amount_cents: 100000,
      paid_amount_cents: 0,
      carry_over_cents: 50000,
      status: 'open',
    })
    const updatedInvoice = {
      ...invoice,
      paid_amount_cents: 150000,
      status: 'paid',
      paid_at: '2026-01-15T12:00:00.000Z',
    }

    mockRepository.findById.mockResolvedValue(invoice)
    mockRepository.update.mockResolvedValue(updatedInvoice)
    mockRepository.findByCardAndMonth.mockResolvedValue(null)

    // effective_total = 100000 + 50000 = 150000
    const result = await sut.execute('user-123', 'invoice-1', 150000)

    expect(result.paid_amount_cents).toBe(150000)
    expect(result.status).toBe('paid')
  })

  it('handles December to January month rollover for carry-over', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      credit_card_id: 'card-1',
      reference_month: '2026-12',
      total_amount_cents: 100000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })
    const updatedInvoice = {
      ...invoice,
      paid_amount_cents: 50000,
      status: 'partially_paid',
    }

    mockRepository.findById.mockResolvedValue(invoice)
    mockRepository.update.mockResolvedValue(updatedInvoice)
    mockRepository.findByCardAndMonth.mockResolvedValue(null)

    await sut.execute('user-123', 'invoice-1', 50000)

    expect(mockRepository.findByCardAndMonth).toHaveBeenCalledWith('card-1', 'user-123', '2027-01')
  })

  it('sets carry-over to zero when fully paid', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      credit_card_id: 'card-1',
      reference_month: '2026-01',
      total_amount_cents: 100000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })
    const nextInvoice = createMockInvoice({
      id: 'invoice-2',
      user_id: 'user-123',
      credit_card_id: 'card-1',
      reference_month: '2026-02',
      carry_over_cents: 100000,
    })
    const updatedInvoice = {
      ...invoice,
      paid_amount_cents: 100000,
      status: 'paid',
      paid_at: '2026-01-15T12:00:00.000Z',
    }

    mockRepository.findById.mockResolvedValue(invoice)
    mockRepository.update.mockResolvedValueOnce(updatedInvoice)
    mockRepository.findByCardAndMonth.mockResolvedValue(nextInvoice)
    mockRepository.update.mockResolvedValueOnce({ ...nextInvoice, carry_over_cents: 0 })

    await sut.execute('user-123', 'invoice-1', 100000)

    expect(mockRepository.update).toHaveBeenNthCalledWith(2, 'invoice-2', 'user-123', {
      carry_over_cents: 0,
    })
  })

  it('throws INTERNAL_ERROR when update fails', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      total_amount_cents: 100000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })

    mockRepository.findById.mockResolvedValue(invoice)
    mockRepository.update.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'invoice-1', 50000)).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'invoice-1', 50000)).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  it('rejects overpayment on partially paid invoice', async () => {
    const invoice = createMockInvoice({
      id: 'invoice-1',
      user_id: 'user-123',
      total_amount_cents: 100000,
      paid_amount_cents: 60000,
      carry_over_cents: 0,
      status: 'partially_paid',
    })

    mockRepository.findById.mockResolvedValue(invoice)

    // remaining = 100000 - 60000 = 40000, trying to pay 40001
    await expect(sut.execute('user-123', 'invoice-1', 40001)).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'invoice-1', 40001)).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      status: HTTP_STATUS.BAD_REQUEST,
    })
  })
})
