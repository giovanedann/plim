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

function createMockSupabase(): {
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
} {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  }
}

function createMockGetOrCreateInvoiceUseCase(): { execute: ReturnType<typeof vi.fn> } {
  return { execute: vi.fn() }
}

function createMockGetCreditCardLimitUsageUseCase(): { execute: ReturnType<typeof vi.fn> } {
  return { execute: vi.fn() }
}

function createMockInvoicesRepository(): {
  findUnpaidByCard: ReturnType<typeof vi.fn>
  findByCardAndMonth: ReturnType<typeof vi.fn>
} {
  return {
    findUnpaidByCard: vi.fn(),
    findByCardAndMonth: vi.fn(),
  }
}

function createMockCreditCardsRepository(): {
  findByUserId: ReturnType<typeof vi.fn>
  findById: ReturnType<typeof vi.fn>
} {
  return {
    findByUserId: vi.fn(),
    findById: vi.fn(),
  }
}

function setupCreditCardLookup(
  mockSupabase: ReturnType<typeof createMockSupabase>,
  creditCard: ReturnType<typeof createMockCreditCard> | null
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
                    data: creditCard,
                    error: creditCard ? null : { message: 'not found' },
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

describe('executeFunction — query_invoices', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let mockGetOrCreateInvoiceUseCase: ReturnType<typeof createMockGetOrCreateInvoiceUseCase>
  let mockGetCreditCardLimitUsageUseCase: ReturnType<
    typeof createMockGetCreditCardLimitUsageUseCase
  >
  let mockInvoicesRepository: ReturnType<typeof createMockInvoicesRepository>
  let mockCreditCardsRepository: ReturnType<typeof createMockCreditCardsRepository>
  let context: FunctionExecutionContext

  const userId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = createMockSupabase()
    mockGetOrCreateInvoiceUseCase = createMockGetOrCreateInvoiceUseCase()
    mockGetCreditCardLimitUsageUseCase = createMockGetCreditCardLimitUsageUseCase()
    mockInvoicesRepository = createMockInvoicesRepository()
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
      getCreditCardLimitUsageUseCase:
        mockGetCreditCardLimitUsageUseCase as unknown as GetCreditCardLimitUsageUseCase,
      payInvoiceUseCase: {} as unknown as PayInvoiceUseCase,
      invoicesRepository: mockInvoicesRepository as unknown as InvoicesRepository,
      creditCardsRepository: mockCreditCardsRepository as unknown as CreditCardsRepository,
    }
  })

  describe('invoice_details', () => {
    it('returns invoice summary with totals and status', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardLookup(mockSupabase, creditCard)

      const invoice = createMockInvoice({
        total_amount_cents: 150000,
        paid_amount_cents: 50000,
        carry_over_cents: 10000,
        status: 'partially_paid',
      })

      mockGetOrCreateInvoiceUseCase.execute.mockResolvedValue({
        invoice,
        transactions: [{ id: 'tx-1' }, { id: 'tx-2' }, { id: 'tx-3' }],
      })

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'Nubank',
            reference_month: '2026-01',
            query_type: 'invoice_details',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_result')
      expect(result.message).toContain('Nubank')
      expect(result.message).toContain('2026-01')
      expect(result.message).toContain('Parcialmente paga')
      expect(result.message).toContain('Transações: 3')
      expect(result.data).toMatchObject({
        invoice,
        transaction_count: 3,
        remaining_cents: 110000,
      })
    })

    it('defaults to current month when reference_month is not provided', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-15T12:00:00.000Z'))

      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardLookup(mockSupabase, creditCard)

      const invoice = createMockInvoice({ status: 'open' })
      mockGetOrCreateInvoiceUseCase.execute.mockResolvedValue({
        invoice,
        transactions: [],
      })

      await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'Nubank',
            query_type: 'invoice_details',
          },
        },
        context
      )

      expect(mockGetOrCreateInvoiceUseCase.execute).toHaveBeenCalledWith(
        userId,
        'card-1',
        '2026-02'
      )

      vi.useRealTimers()
    })

    it('returns error when credit card name is not provided', async () => {
      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            query_type: 'invoice_details',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('cartão de crédito')
    })

    it('returns error when credit card is not found', async () => {
      setupCreditCardLookup(mockSupabase, null)

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'CartaoInexistente',
            reference_month: '2026-01',
            query_type: 'invoice_details',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('CartaoInexistente')
    })

    it('returns error when use case throws', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardLookup(mockSupabase, creditCard)

      mockGetOrCreateInvoiceUseCase.execute.mockRejectedValue(new Error('No closing day'))

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'Nubank',
            reference_month: '2026-01',
            query_type: 'invoice_details',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('dia de fechamento')
    })
  })

  describe('limit_usage', () => {
    it('returns formatted limit usage data', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardLookup(mockSupabase, creditCard)

      mockGetCreditCardLimitUsageUseCase.execute.mockResolvedValue({
        credit_card_id: 'card-1',
        credit_limit_cents: 500000,
        used_cents: 150000,
        available_cents: 350000,
      })

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'Nubank',
            query_type: 'limit_usage',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_result')
      expect(result.message).toContain('Nubank')
      expect(result.message).toContain('Limite total')
      expect(result.message).toContain('Utilizado')
      expect(result.message).toContain('Disponível')
      expect(result.data).toMatchObject({
        credit_limit_cents: 500000,
        used_cents: 150000,
        available_cents: 350000,
      })
    })

    it('returns error when credit card name is not provided', async () => {
      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            query_type: 'limit_usage',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('cartão de crédito')
    })

    it('returns error when credit card is not found', async () => {
      setupCreditCardLookup(mockSupabase, null)

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'CartaoInexistente',
            query_type: 'limit_usage',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('CartaoInexistente')
    })

    it('returns error when use case throws', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardLookup(mockSupabase, creditCard)

      mockGetCreditCardLimitUsageUseCase.execute.mockRejectedValue(new Error('No limit configured'))

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'Nubank',
            query_type: 'limit_usage',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('limite')
    })
  })

  describe('open_invoices', () => {
    it('returns open invoices for a specific card', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardLookup(mockSupabase, creditCard)

      const invoices = [
        createMockInvoice({
          reference_month: '2026-01',
          total_amount_cents: 150000,
          paid_amount_cents: 0,
          carry_over_cents: 0,
          status: 'open',
        }),
        createMockInvoice({
          reference_month: '2025-12',
          total_amount_cents: 80000,
          paid_amount_cents: 30000,
          carry_over_cents: 5000,
          status: 'partially_paid',
        }),
      ]
      mockInvoicesRepository.findUnpaidByCard.mockResolvedValue(invoices)

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'Nubank',
            query_type: 'open_invoices',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_result')
      expect(result.message).toContain('Faturas em aberto (2)')
      expect(result.message).toContain('Nubank - 2026-01')
      expect(result.message).toContain('Nubank - 2025-12')
      expect(result.message).toContain('Total pendente')

      const data = result.data as {
        invoices: Array<{ remaining_cents: number }>
        total_remaining_cents: number
      }
      expect(data.invoices).toHaveLength(2)
      expect(data.invoices[0]!.remaining_cents).toBe(150000)
      expect(data.invoices[1]!.remaining_cents).toBe(55000)
      expect(data.total_remaining_cents).toBe(205000)
    })

    it('returns open invoices for all cards when no card name provided', async () => {
      const cards = [
        createMockCreditCard({ id: 'card-1', name: 'Nubank' }),
        createMockCreditCard({ id: 'card-2', name: 'Itau' }),
      ]
      mockCreditCardsRepository.findByUserId.mockResolvedValue(cards)

      const nubankInvoices = [
        createMockInvoice({
          credit_card_id: 'card-1',
          reference_month: '2026-01',
          total_amount_cents: 100000,
          paid_amount_cents: 0,
          carry_over_cents: 0,
          status: 'open',
        }),
      ]
      const itauInvoices = [
        createMockInvoice({
          credit_card_id: 'card-2',
          reference_month: '2026-01',
          total_amount_cents: 200000,
          paid_amount_cents: 50000,
          carry_over_cents: 0,
          status: 'partially_paid',
        }),
      ]

      mockInvoicesRepository.findUnpaidByCard.mockImplementation((cardId: string) => {
        if (cardId === 'card-1') return Promise.resolve(nubankInvoices)
        if (cardId === 'card-2') return Promise.resolve(itauInvoices)
        return Promise.resolve([])
      })

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            query_type: 'open_invoices',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_result')
      expect(result.message).toContain('Faturas em aberto (2)')
      expect(result.message).toContain('Nubank')
      expect(result.message).toContain('Itau')

      const data = result.data as { total_remaining_cents: number }
      expect(data.total_remaining_cents).toBe(250000)
    })

    it('returns message when no open invoices exist', async () => {
      const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
      setupCreditCardLookup(mockSupabase, creditCard)

      mockInvoicesRepository.findUnpaidByCard.mockResolvedValue([])

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'Nubank',
            query_type: 'open_invoices',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_result')
      expect(result.message).toContain('não tem faturas em aberto')
      expect(result.data).toMatchObject({ invoices: [] })
    })

    it('returns message when no credit cards exist', async () => {
      mockCreditCardsRepository.findByUserId.mockResolvedValue([])

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            query_type: 'open_invoices',
          },
        },
        context
      )

      expect(result.success).toBe(true)
      expect(result.actionType).toBe('invoice_result')
      expect(result.message).toContain('não tem cartões de crédito')
    })

    it('returns error when specified card is not found', async () => {
      setupCreditCardLookup(mockSupabase, null)

      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            credit_card_name: 'CartaoInexistente',
            query_type: 'open_invoices',
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
    it('returns error for invalid query_type', async () => {
      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {
            query_type: 'invalid_type',
          },
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
    })

    it('returns error when query_type is missing', async () => {
      const result = await executeFunction(
        {
          name: 'query_invoices',
          args: {},
        },
        context
      )

      expect(result.success).toBe(false)
      expect(result.actionType).toBe('error')
      expect(result.message).toContain('faturas')
    })
  })
})
