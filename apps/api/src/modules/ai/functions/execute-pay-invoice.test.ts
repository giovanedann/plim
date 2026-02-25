import { createMockCreditCard, createMockInvoice } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreditCardsRepository } from '../../credit-cards/credit-cards.repository'
import type { UpdateCreditCardUseCase } from '../../credit-cards/update-credit-card.usecase'
import type { CreateExpenseUseCase } from '../../expenses/create-expense.usecase'
import type { ExpensesRepository } from '../../expenses/expenses.repository'
import type { GetCreditCardLimitUsageUseCase } from '../../invoices/get-credit-card-limit-usage.usecase'
import type { GetOrCreateInvoiceUseCase } from '../../invoices/get-or-create-invoice.usecase'
import type { InvoicesRepository } from '../../invoices/invoices.repository'
import type { PayInvoiceUseCase } from '../../invoices/pay-invoice.usecase'
import type { CreateSalaryUseCase } from '../../salary/create-salary.usecase'
import { type FunctionExecutionContext, executeFunction } from './execute-function'

type MockSupabase = {
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
}

function createMockSupabase(): MockSupabase {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  }
}

function createMockGetOrCreateInvoiceUseCase(): { execute: ReturnType<typeof vi.fn> } {
  return { execute: vi.fn() }
}

function createMockPayInvoiceUseCase(): { execute: ReturnType<typeof vi.fn> } {
  return { execute: vi.fn() }
}

function createMockCreditCardsRepository(): { findByUserId: ReturnType<typeof vi.fn> } {
  return { findByUserId: vi.fn() }
}

describe('executePayInvoice', () => {
  let mockSupabase: MockSupabase
  let mockGetOrCreateInvoiceUseCase: ReturnType<typeof createMockGetOrCreateInvoiceUseCase>
  let mockPayInvoiceUseCase: ReturnType<typeof createMockPayInvoiceUseCase>
  let mockCreditCardsRepository: ReturnType<typeof createMockCreditCardsRepository>
  let context: FunctionExecutionContext

  const userId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = createMockSupabase()
    mockGetOrCreateInvoiceUseCase = createMockGetOrCreateInvoiceUseCase()
    mockPayInvoiceUseCase = createMockPayInvoiceUseCase()
    mockCreditCardsRepository = createMockCreditCardsRepository()

    context = {
      userId,
      supabase: mockSupabase as never,
      createExpenseUseCase: {} as unknown as CreateExpenseUseCase,
      createSalaryUseCase: {} as unknown as CreateSalaryUseCase,
      expensesRepository: {} as unknown as ExpensesRepository,
      updateCreditCardUseCase: {} as unknown as UpdateCreditCardUseCase,
      getOrCreateInvoiceUseCase:
        mockGetOrCreateInvoiceUseCase as unknown as GetOrCreateInvoiceUseCase,
      getCreditCardLimitUsageUseCase: {} as unknown as GetCreditCardLimitUsageUseCase,
      payInvoiceUseCase: mockPayInvoiceUseCase as unknown as PayInvoiceUseCase,
      invoicesRepository: {} as unknown as InvoicesRepository,
      creditCardsRepository: mockCreditCardsRepository as unknown as CreditCardsRepository,
    }
  })

  function setupCreditCardByNameMock(
    cardData: ReturnType<typeof createMockCreditCard> | null
  ): void {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'credit_card') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: cardData,
                      error: cardData ? null : { message: 'not found' },
                    }),
                  }),
                }),
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })
  }

  describe('full payment via pay_full: true', () => {
    it('pays invoice in full when pay_full is true', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardByNameMock(creditCard)

      const invoice = createMockInvoice({
        id: 'inv-1',
        credit_card_id: 'card-1',
        reference_month: '2026-01',
        total_amount_cents: 150000,
        paid_amount_cents: 0,
        carry_over_cents: 10000,
        status: 'open',
      })

      mockGetOrCreateInvoiceUseCase.execute.mockResolvedValue({
        invoice,
        transactions: [],
      })

      const updatedInvoice = createMockInvoice({
        ...invoice,
        paid_amount_cents: 160000,
        status: 'paid',
        paid_at: '2026-01-20T12:00:00.000Z',
      })
      mockPayInvoiceUseCase.execute.mockResolvedValue(updatedInvoice)

      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            credit_card_name: 'Nubank',
            reference_month: '2026-01',
            pay_full: true,
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_paid')
      expect(result.message).toContain('integralmente')
      expect(result.message).toContain('Nubank')
      expect(result.message).toContain('2026-01')
      expect(mockPayInvoiceUseCase.execute).toHaveBeenCalledWith(userId, 'inv-1', 160000)
    })
  })

  describe('partial payment with explicit amount_cents', () => {
    it('pays partial amount when amount_cents is provided', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardByNameMock(creditCard)

      const invoice = createMockInvoice({
        id: 'inv-1',
        credit_card_id: 'card-1',
        reference_month: '2026-01',
        total_amount_cents: 150000,
        paid_amount_cents: 0,
        carry_over_cents: 0,
        status: 'open',
      })

      mockGetOrCreateInvoiceUseCase.execute.mockResolvedValue({
        invoice,
        transactions: [],
      })

      const updatedInvoice = createMockInvoice({
        ...invoice,
        paid_amount_cents: 100000,
        status: 'partially_paid',
      })
      mockPayInvoiceUseCase.execute.mockResolvedValue(updatedInvoice)

      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            credit_card_name: 'Nubank',
            reference_month: '2026-01',
            amount_cents: 100000,
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_paid')
      expect(result.message).toContain('Restante')
      expect(mockPayInvoiceUseCase.execute).toHaveBeenCalledWith(userId, 'inv-1', 100000)
    })
  })

  describe('card resolution when only one card exists', () => {
    it('auto-resolves credit card when user has only one active card', async () => {
      const creditCard = createMockCreditCard({ id: 'card-solo', name: 'Itau' })
      mockCreditCardsRepository.findByUserId.mockResolvedValue([creditCard])

      const invoice = createMockInvoice({
        id: 'inv-1',
        credit_card_id: 'card-solo',
        reference_month: '2026-02',
        total_amount_cents: 50000,
        paid_amount_cents: 0,
        carry_over_cents: 0,
        status: 'open',
      })

      mockGetOrCreateInvoiceUseCase.execute.mockResolvedValue({
        invoice,
        transactions: [],
      })

      const updatedInvoice = createMockInvoice({
        ...invoice,
        paid_amount_cents: 50000,
        status: 'paid',
        paid_at: '2026-02-15T12:00:00.000Z',
      })
      mockPayInvoiceUseCase.execute.mockResolvedValue(updatedInvoice)

      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            reference_month: '2026-02',
            pay_full: true,
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_paid')
      expect(result.message).toContain('Itau')
      expect(mockCreditCardsRepository.findByUserId).toHaveBeenCalledWith(userId)
      expect(mockGetOrCreateInvoiceUseCase.execute).toHaveBeenCalledWith(
        userId,
        'card-solo',
        '2026-02'
      )
    })

    it('asks for card name when user has multiple cards and no name provided', async () => {
      const cards = [
        createMockCreditCard({ id: 'card-1', name: 'Nubank' }),
        createMockCreditCard({ id: 'card-2', name: 'Itau' }),
      ]
      mockCreditCardsRepository.findByUserId.mockResolvedValue(cards)

      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            reference_month: '2026-01',
            pay_full: true,
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('mais de um cartão')
    })

    it('returns error when user has no active cards and no name provided', async () => {
      mockCreditCardsRepository.findByUserId.mockResolvedValue([])

      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            reference_month: '2026-01',
            pay_full: true,
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('não tem cartões')
    })
  })

  describe('card not found', () => {
    it('returns error when named credit card is not found', async () => {
      setupCreditCardByNameMock(null)

      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            credit_card_name: 'CartaoInexistente',
            reference_month: '2026-01',
            pay_full: true,
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('CartaoInexistente')
    })
  })

  describe('invalid params', () => {
    it('returns error when reference_month is missing', async () => {
      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {},
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('Não consegui entender')
    })

    it('returns error when amount_cents is zero', async () => {
      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            reference_month: '2026-01',
            amount_cents: 0,
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
    })

    it('returns error when amount_cents is negative', async () => {
      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            reference_month: '2026-01',
            amount_cents: -500,
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
    })
  })

  describe('already paid invoice', () => {
    it('returns success message when invoice is already fully paid', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardByNameMock(creditCard)

      const invoice = createMockInvoice({
        id: 'inv-1',
        credit_card_id: 'card-1',
        reference_month: '2026-01',
        total_amount_cents: 150000,
        paid_amount_cents: 150000,
        carry_over_cents: 0,
        status: 'paid',
      })

      mockGetOrCreateInvoiceUseCase.execute.mockResolvedValue({
        invoice,
        transactions: [],
      })

      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            credit_card_name: 'Nubank',
            reference_month: '2026-01',
            pay_full: true,
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_paid')
      expect(result.message).toContain('já está paga')
      expect(mockPayInvoiceUseCase.execute).not.toHaveBeenCalled()
    })
  })

  describe('full payment when no amount_cents and no pay_full', () => {
    it('defaults to full remaining amount when neither amount_cents nor pay_full is provided', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardByNameMock(creditCard)

      const invoice = createMockInvoice({
        id: 'inv-1',
        credit_card_id: 'card-1',
        reference_month: '2026-01',
        total_amount_cents: 80000,
        paid_amount_cents: 20000,
        carry_over_cents: 5000,
        status: 'partially_paid',
      })

      mockGetOrCreateInvoiceUseCase.execute.mockResolvedValue({
        invoice,
        transactions: [],
      })

      const updatedInvoice = createMockInvoice({
        ...invoice,
        paid_amount_cents: 85000,
        status: 'paid',
        paid_at: '2026-01-20T12:00:00.000Z',
      })
      mockPayInvoiceUseCase.execute.mockResolvedValue(updatedInvoice)

      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            credit_card_name: 'Nubank',
            reference_month: '2026-01',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_paid')
      // remaining = 80000 + 5000 - 20000 = 65000
      expect(mockPayInvoiceUseCase.execute).toHaveBeenCalledWith(userId, 'inv-1', 65000)
    })
  })

  describe('use case error handling', () => {
    it('returns error when pay invoice use case throws', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardByNameMock(creditCard)

      const invoice = createMockInvoice({
        id: 'inv-1',
        credit_card_id: 'card-1',
        reference_month: '2026-01',
        total_amount_cents: 150000,
        paid_amount_cents: 0,
        carry_over_cents: 0,
        status: 'open',
      })

      mockGetOrCreateInvoiceUseCase.execute.mockResolvedValue({
        invoice,
        transactions: [],
      })

      mockPayInvoiceUseCase.execute.mockRejectedValue(new Error('Payment failed'))

      const result = await executeFunction(
        {
          name: 'pay_invoice',
          args: {
            credit_card_name: 'Nubank',
            reference_month: '2026-01',
            pay_full: true,
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('Não consegui registrar o pagamento')
    })
  })
})
