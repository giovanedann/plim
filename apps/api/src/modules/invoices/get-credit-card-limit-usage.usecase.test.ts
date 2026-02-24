import { ERROR_CODES, HTTP_STATUS, createMockCreditCard, createMockInvoice } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from '../credit-cards/credit-cards.repository'
import { GetCreditCardLimitUsageUseCase } from './get-credit-card-limit-usage.usecase'
import type { InvoicesRepository } from './invoices.repository'

type MockInvoicesRepository = Pick<InvoicesRepository, 'findUnpaidByCard'>
type MockCreditCardsRepository = Pick<CreditCardsRepository, 'findById'>

function createMockInvoicesRepository(): MockInvoicesRepository {
  return {
    findUnpaidByCard: vi.fn(),
  }
}

function createMockCreditCardsRepository(): MockCreditCardsRepository {
  return {
    findById: vi.fn(),
  }
}

describe('GetCreditCardLimitUsageUseCase', () => {
  let sut: GetCreditCardLimitUsageUseCase
  let mockInvoicesRepo: MockInvoicesRepository
  let mockCreditCardsRepo: MockCreditCardsRepository

  const userId = 'user-123'
  const creditCardId = 'card-123'

  beforeEach(() => {
    mockInvoicesRepo = createMockInvoicesRepository()
    mockCreditCardsRepo = createMockCreditCardsRepository()
    sut = new GetCreditCardLimitUsageUseCase(
      mockInvoicesRepo as InvoicesRepository,
      mockCreditCardsRepo as CreditCardsRepository
    )
  })

  it('calculates usage for a single unpaid invoice', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
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
    })
  })

  it('calculates usage for multiple unpaid invoices', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
    })
    const invoice1 = createMockInvoice({
      credit_card_id: creditCardId,
      user_id: userId,
      total_amount_cents: 100000,
      paid_amount_cents: 20000,
      carry_over_cents: 5000,
      status: 'partially_paid',
    })
    const invoice2 = createMockInvoice({
      credit_card_id: creditCardId,
      user_id: userId,
      total_amount_cents: 200000,
      paid_amount_cents: 0,
      carry_over_cents: 10000,
      status: 'open',
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([invoice1, invoice2])

    const result = await sut.execute(userId, creditCardId)

    // invoice1: 100000 + 5000 - 20000 = 85000
    // invoice2: 200000 + 10000 - 0 = 210000
    // total used: 295000
    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 500000,
      used_cents: 295000,
      available_cents: 205000,
    })
  })

  it('returns used 0 when all invoices are paid', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 500000,
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([])

    const result = await sut.execute(userId, creditCardId)

    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 500000,
      used_cents: 0,
      available_cents: 500000,
    })
  })

  it('returns available 0 when usage exceeds limit', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: 100000,
    })
    const invoice = createMockInvoice({
      credit_card_id: creditCardId,
      user_id: userId,
      total_amount_cents: 120000,
      paid_amount_cents: 0,
      carry_over_cents: 5000,
      status: 'open',
    })

    mockCreditCardsRepo.findById = vi.fn().mockResolvedValue(creditCard)
    mockInvoicesRepo.findUnpaidByCard = vi.fn().mockResolvedValue([invoice])

    const result = await sut.execute(userId, creditCardId)

    expect(result).toEqual({
      credit_card_id: creditCardId,
      credit_limit_cents: 100000,
      used_cents: 125000,
      available_cents: 0,
    })
  })

  it('throws VALIDATION_ERROR when credit card has no limit set', async () => {
    const creditCard = createMockCreditCard({
      id: creditCardId,
      user_id: userId,
      credit_limit_cents: null,
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
})
