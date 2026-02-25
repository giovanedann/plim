import { ERROR_CODES, HTTP_STATUS, createMockCreditCard, createMockInvoice } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from '../credit-cards/credit-cards.repository'
import { GetCreditCardLimitUsageUseCase } from './get-credit-card-limit-usage.usecase'
import type { GetOrCreateInvoiceUseCase } from './get-or-create-invoice.usecase'
import type { InvoicesRepository } from './invoices.repository'

type MockInvoicesRepository = Pick<
  InvoicesRepository,
  'findUnpaidByCard' | 'sumFutureInstallments' | 'sumActiveRecurrences'
>
type MockCreditCardsRepository = Pick<CreditCardsRepository, 'findById'>
type MockGetOrCreateInvoice = Pick<GetOrCreateInvoiceUseCase, 'execute'>

function createMockInvoicesRepository(): MockInvoicesRepository {
  return {
    findUnpaidByCard: vi.fn().mockResolvedValue([]),
    sumFutureInstallments: vi.fn().mockResolvedValue(0),
    sumActiveRecurrences: vi.fn().mockResolvedValue(0),
  }
}

function createMockCreditCardsRepository(): MockCreditCardsRepository {
  return {
    findById: vi.fn(),
  }
}

function createMockGetOrCreateInvoice(): MockGetOrCreateInvoice {
  return {
    execute: vi.fn().mockResolvedValue({ invoice: createMockInvoice(), transactions: [] }),
  }
}

describe('GetCreditCardLimitUsageUseCase', () => {
  let sut: GetCreditCardLimitUsageUseCase
  let mockInvoicesRepo: MockInvoicesRepository
  let mockCreditCardsRepo: MockCreditCardsRepository
  let mockGetOrCreateInvoice: MockGetOrCreateInvoice

  const userId = 'user-123'
  const creditCardId = 'card-123'

  beforeEach(() => {
    mockInvoicesRepo = createMockInvoicesRepository()
    mockCreditCardsRepo = createMockCreditCardsRepository()
    mockGetOrCreateInvoice = createMockGetOrCreateInvoice()
    sut = new GetCreditCardLimitUsageUseCase(
      mockInvoicesRepo as InvoicesRepository,
      mockCreditCardsRepo as CreditCardsRepository,
      mockGetOrCreateInvoice as GetOrCreateInvoiceUseCase
    )
  })

  it('ensures current month invoice is created before calculating usage', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
      closing_day: 10,
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)

    await sut.execute(userId, creditCardId)

    expect(mockGetOrCreateInvoice.execute).toHaveBeenCalledWith(
      userId,
      creditCardId,
      expect.stringMatching(/^\d{4}-\d{2}$/)
    )
  })

  it('calculates usage from unpaid invoices without carry_over', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
      closing_day: 10,
    })
    const invoice = createMockInvoice({
      credit_card_id: creditCardId,
      user_id: userId,
      total_amount_cents: 150000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([invoice])

    const result = await sut.execute(userId, creditCardId)

    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 500000,
      used_cents: 150000,
      available_cents: 350000,
      recurrent_commitment_cents: 0,
    })
  })

  it('excludes carry_over to avoid double-counting across invoices', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
      closing_day: 10,
    })
    const invoiceOlder = createMockInvoice({
      credit_card_id: creditCardId,
      user_id: userId,
      total_amount_cents: 100000,
      paid_amount_cents: 50000,
      carry_over_cents: 0,
      status: 'partially_paid',
    })
    const invoiceNewer = createMockInvoice({
      credit_card_id: creditCardId,
      user_id: userId,
      total_amount_cents: 200000,
      paid_amount_cents: 0,
      carry_over_cents: 50000,
      status: 'open',
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([invoiceNewer, invoiceOlder])

    const result = await sut.execute(userId, creditCardId)

    // Correct: (100000 - 50000) + (200000 - 0) = 250000
    // Wrong (with carry_over): (100000 - 50000) + (200000 + 50000 - 0) = 300000
    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 500000,
      used_cents: 250000,
      available_cents: 250000,
      recurrent_commitment_cents: 0,
    })
  })

  it('returns used 0 when no unpaid invoices exist', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
      closing_day: 10,
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([])

    const result = await sut.execute(userId, creditCardId)

    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 500000,
      used_cents: 0,
      available_cents: 500000,
      recurrent_commitment_cents: 0,
    })
  })

  it('returns available 0 when usage exceeds limit', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 100000,
      closing_day: 10,
    })
    const invoice = createMockInvoice({
      credit_card_id: creditCardId,
      user_id: userId,
      total_amount_cents: 150000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([invoice])

    const result = await sut.execute(userId, creditCardId)

    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 100000,
      used_cents: 150000,
      available_cents: 0,
      recurrent_commitment_cents: 0,
    })
  })

  it('throws VALIDATION_ERROR when credit card has no limit set', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: null,
      closing_day: 10,
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)

    await expect(sut.execute(userId, creditCardId)).rejects.toThrow(AppError)
    await expect(sut.execute(userId, creditCardId)).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      status: HTTP_STATUS.BAD_REQUEST,
    })
  })

  it('throws VALIDATION_ERROR when credit card has no closing day', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
      closing_day: null,
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)

    await expect(sut.execute(userId, creditCardId)).rejects.toThrow(AppError)
    await expect(sut.execute(userId, creditCardId)).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      status: HTTP_STATUS.BAD_REQUEST,
    })
  })

  it('throws NOT_FOUND when credit card does not exist', async () => {
    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(null)

    await expect(sut.execute(userId, 'nonexistent')).rejects.toThrow(AppError)
    await expect(sut.execute(userId, 'nonexistent')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('includes future installments in used_cents', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
      closing_day: 10,
    })
    const invoice = createMockInvoice({
      credit_card_id: creditCardId,
      user_id: userId,
      total_amount_cents: 100000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([invoice])
    mockInvoicesRepo.sumFutureInstallments = vi.fn().mockResolvedValue(120000)

    const result = await sut.execute(userId, creditCardId)

    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 500000,
      used_cents: 220000,
      available_cents: 280000,
      recurrent_commitment_cents: 0,
    })
  })

  it('returns recurrent_commitment_cents without adding to used_cents', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
      closing_day: 10,
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([])
    mockInvoicesRepo.sumActiveRecurrences = vi.fn().mockResolvedValue(50000)

    const result = await sut.execute(userId, creditCardId)

    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 500000,
      used_cents: 0,
      available_cents: 500000,
      recurrent_commitment_cents: 50000,
    })
  })

  it('clamps available_cents to 0 when future installments exceed remaining limit', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 100000,
      closing_day: 10,
    })
    const invoice = createMockInvoice({
      credit_card_id: creditCardId,
      user_id: userId,
      total_amount_cents: 80000,
      paid_amount_cents: 0,
      carry_over_cents: 0,
      status: 'open',
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([invoice])
    mockInvoicesRepo.sumFutureInstallments = vi.fn().mockResolvedValue(50000)

    const result = await sut.execute(userId, creditCardId)

    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 100000,
      used_cents: 130000,
      available_cents: 0,
      recurrent_commitment_cents: 0,
    })
  })
})
