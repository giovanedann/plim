import {
  ERROR_CODES,
  HTTP_STATUS,
  createMockCreditCard,
  createMockExpense,
  createMockInvoice,
  resetIdCounter,
} from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from '../credit-cards/credit-cards.repository'
import { GetOrCreateInvoiceUseCase } from './get-or-create-invoice.usecase'
import type { InvoicesRepository } from './invoices.repository'

type MockInvoicesRepository = {
  findByCardAndMonth: ReturnType<typeof vi.fn>
  getTransactionsForCycle: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
}

type MockCreditCardsRepository = {
  findById: ReturnType<typeof vi.fn>
}

const USER_ID = 'user-123'
const CARD_ID = 'card-456'

describe('GetOrCreateInvoiceUseCase', () => {
  let sut: GetOrCreateInvoiceUseCase
  let mockInvoicesRepo: MockInvoicesRepository
  let mockCreditCardsRepo: MockCreditCardsRepository

  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()

    mockInvoicesRepo = {
      findByCardAndMonth: vi.fn(),
      getTransactionsForCycle: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }

    mockCreditCardsRepo = {
      findById: vi.fn(),
    }

    sut = new GetOrCreateInvoiceUseCase(
      mockInvoicesRepo as unknown as InvoicesRepository,
      mockCreditCardsRepo as unknown as CreditCardsRepository
    )
  })

  describe('credit card validation', () => {
    it('throws NOT_FOUND when credit card does not exist', async () => {
      mockCreditCardsRepo.findById.mockResolvedValue(null)

      await expect(sut.execute(USER_ID, CARD_ID, '2026-02')).rejects.toThrow(AppError)
      await expect(sut.execute(USER_ID, CARD_ID, '2026-02')).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      })
    })

    it('throws VALIDATION_ERROR when credit card has no closing_day', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: null })
      mockCreditCardsRepo.findById.mockResolvedValue(card)

      await expect(sut.execute(USER_ID, CARD_ID, '2026-02')).rejects.toThrow(AppError)
      await expect(sut.execute(USER_ID, CARD_ID, '2026-02')).rejects.toMatchObject({
        code: ERROR_CODES.VALIDATION_ERROR,
        status: HTTP_STATUS.BAD_REQUEST,
      })
    })
  })

  describe('existing invoice path', () => {
    it('returns existing invoice with fresh transactions', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })
      const existingInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-02',
        cycle_start: '2026-02-11',
        cycle_end: '2026-03-10',
        total_amount_cents: 15000,
      })
      const transactions = [
        createMockExpense({ amount_cents: 5000, credit_card_id: CARD_ID }),
        createMockExpense({ amount_cents: 10000, credit_card_id: CARD_ID }),
      ]

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth.mockResolvedValue(existingInvoice)
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue(transactions)

      const result = await sut.execute(USER_ID, CARD_ID, '2026-02')

      expect(result.invoice).toEqual(existingInvoice)
      expect(result.transactions).toEqual(transactions)
      expect(mockInvoicesRepo.create).not.toHaveBeenCalled()
    })

    it('updates total_amount_cents when transactions changed', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })
      const existingInvoice = createMockInvoice({
        id: 'inv-1',
        credit_card_id: CARD_ID,
        reference_month: '2026-02',
        cycle_start: '2026-02-11',
        cycle_end: '2026-03-10',
        total_amount_cents: 15000,
      })
      const transactions = [
        createMockExpense({ amount_cents: 5000, credit_card_id: CARD_ID }),
        createMockExpense({ amount_cents: 12000, credit_card_id: CARD_ID }),
      ]
      const updatedInvoice = { ...existingInvoice, total_amount_cents: 17000 }

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth.mockResolvedValue(existingInvoice)
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue(transactions)
      mockInvoicesRepo.update.mockResolvedValue(updatedInvoice)

      const result = await sut.execute(USER_ID, CARD_ID, '2026-02')

      expect(result.invoice.total_amount_cents).toBe(17000)
      expect(mockInvoicesRepo.update).toHaveBeenCalledWith('inv-1', USER_ID, {
        total_amount_cents: 17000,
        cycle_start: '2026-02-11',
        cycle_end: '2026-03-10',
      })
    })

    it('falls back to in-memory update when repository update returns null', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })
      const existingInvoice = createMockInvoice({
        id: 'inv-1',
        credit_card_id: CARD_ID,
        reference_month: '2026-02',
        cycle_start: '2026-02-11',
        cycle_end: '2026-03-10',
        total_amount_cents: 15000,
      })
      const transactions = [createMockExpense({ amount_cents: 8000, credit_card_id: CARD_ID })]

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth.mockResolvedValue(existingInvoice)
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue(transactions)
      mockInvoicesRepo.update.mockResolvedValue(null)

      const result = await sut.execute(USER_ID, CARD_ID, '2026-02')

      expect(result.invoice.total_amount_cents).toBe(8000)
    })
  })

  describe('new invoice path', () => {
    it('creates a new invoice with correct cycle dates and total', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })
      const transactions = [
        createMockExpense({ amount_cents: 3000, credit_card_id: CARD_ID }),
        createMockExpense({ amount_cents: 7000, credit_card_id: CARD_ID }),
      ]
      const createdInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-02',
        cycle_start: '2026-02-11',
        cycle_end: '2026-03-10',
        total_amount_cents: 10000,
        carry_over_cents: 0,
      })

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth.mockResolvedValueOnce(null) // current month
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue(transactions)
      mockInvoicesRepo.findByCardAndMonth.mockResolvedValueOnce(null) // previous month carry-over lookup
      mockInvoicesRepo.create.mockResolvedValue(createdInvoice)

      const result = await sut.execute(USER_ID, CARD_ID, '2026-02')

      expect(result.invoice).toEqual(createdInvoice)
      expect(result.transactions).toEqual(transactions)
      expect(mockInvoicesRepo.create).toHaveBeenCalledWith(USER_ID, {
        credit_card_id: CARD_ID,
        reference_month: '2026-02',
        cycle_start: '2026-02-11',
        cycle_end: '2026-03-10',
        total_amount_cents: 10000,
        paid_amount_cents: 0,
        carry_over_cents: 0,
        status: 'open',
      })
    })

    it('creates invoice with no transactions (zero total)', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 15 })
      const createdInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-03',
        total_amount_cents: 0,
      })

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth.mockResolvedValue(null)
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue([])
      mockInvoicesRepo.create.mockResolvedValue(createdInvoice)

      const result = await sut.execute(USER_ID, CARD_ID, '2026-03')

      expect(result.invoice.total_amount_cents).toBe(0)
      expect(result.transactions).toEqual([])
    })

    it('throws INTERNAL_ERROR when invoice creation fails', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth.mockResolvedValue(null)
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue([])
      mockInvoicesRepo.create.mockResolvedValue(null)

      await expect(sut.execute(USER_ID, CARD_ID, '2026-02')).rejects.toThrow(AppError)
      await expect(sut.execute(USER_ID, CARD_ID, '2026-02')).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      })
    })
  })

  describe('carry-over calculation', () => {
    it('calculates carry-over from unpaid previous invoice', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })
      const previousInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-01',
        total_amount_cents: 50000,
        paid_amount_cents: 30000,
        carry_over_cents: 5000,
        status: 'partially_paid',
      })
      const createdInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-02',
        carry_over_cents: 25000, // 50000 + 5000 - 30000
      })

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth
        .mockResolvedValueOnce(null) // current month doesn't exist
        .mockResolvedValueOnce(previousInvoice) // previous month lookup
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue([])
      mockInvoicesRepo.create.mockResolvedValue(createdInvoice)

      await sut.execute(USER_ID, CARD_ID, '2026-02')

      expect(mockInvoicesRepo.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          carry_over_cents: 25000,
        })
      )
    })

    it('sets carry-over to zero when previous invoice is paid', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })
      const previousInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-01',
        total_amount_cents: 50000,
        paid_amount_cents: 50000,
        carry_over_cents: 0,
        status: 'paid',
      })
      const createdInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-02',
        carry_over_cents: 0,
      })

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth
        .mockResolvedValueOnce(null) // current month
        .mockResolvedValueOnce(previousInvoice) // previous month
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue([])
      mockInvoicesRepo.create.mockResolvedValue(createdInvoice)

      await sut.execute(USER_ID, CARD_ID, '2026-02')

      expect(mockInvoicesRepo.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          carry_over_cents: 0,
        })
      )
    })

    it('sets carry-over to zero when no previous invoice exists', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })
      const createdInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-02',
        carry_over_cents: 0,
      })

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth.mockResolvedValue(null) // both current and previous
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue([])
      mockInvoicesRepo.create.mockResolvedValue(createdInvoice)

      await sut.execute(USER_ID, CARD_ID, '2026-02')

      expect(mockInvoicesRepo.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          carry_over_cents: 0,
        })
      )
    })

    it('handles carry-over for January (previous month is December of prior year)', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })
      const previousInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2025-12',
        total_amount_cents: 40000,
        paid_amount_cents: 10000,
        carry_over_cents: 2000,
        status: 'open',
      })
      const createdInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-01',
        carry_over_cents: 32000, // 40000 + 2000 - 10000
      })

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth
        .mockResolvedValueOnce(null) // current month (Jan 2026)
        .mockResolvedValueOnce(previousInvoice) // previous month (Dec 2025)
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue([])
      mockInvoicesRepo.create.mockResolvedValue(createdInvoice)

      await sut.execute(USER_ID, CARD_ID, '2026-01')

      expect(mockInvoicesRepo.findByCardAndMonth).toHaveBeenCalledWith(CARD_ID, USER_ID, '2025-12')
      expect(mockInvoicesRepo.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          carry_over_cents: 32000,
        })
      )
    })

    it('includes carry-over from open invoice with existing carry-over', async () => {
      const card = createMockCreditCard({ id: CARD_ID, closing_day: 10 })
      const previousInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-01',
        total_amount_cents: 20000,
        paid_amount_cents: 0,
        carry_over_cents: 15000,
        status: 'open',
      })
      const createdInvoice = createMockInvoice({
        credit_card_id: CARD_ID,
        reference_month: '2026-02',
        carry_over_cents: 35000, // 20000 + 15000 - 0
      })

      mockCreditCardsRepo.findById.mockResolvedValue(card)
      mockInvoicesRepo.findByCardAndMonth
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(previousInvoice)
      mockInvoicesRepo.getTransactionsForCycle.mockResolvedValue([])
      mockInvoicesRepo.create.mockResolvedValue(createdInvoice)

      await sut.execute(USER_ID, CARD_ID, '2026-02')

      expect(mockInvoicesRepo.create).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          carry_over_cents: 35000,
        })
      )
    })
  })
})
