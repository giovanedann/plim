import { createMockCreditCard } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreditCardsRepository } from '../../credit-cards/credit-cards.repository'
import type { UpdateCreditCardUseCase } from '../../credit-cards/update-credit-card.usecase'
import type { CreateExpenseUseCase } from '../../expenses/create-expense.usecase'
import type { ExpensesRepository } from '../../expenses/expenses.repository'
import type { GetCreditCardLimitUsageUseCase } from '../../invoices/get-credit-card-limit-usage.usecase'
import type { GetOrCreateInvoiceUseCase } from '../../invoices/get-or-create-invoice.usecase'
import type { InvoicesRepository } from '../../invoices/invoices.repository'
import type { PayInvoiceUseCase } from '../../invoices/pay-invoice.usecase'
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

function createMockUpdateCreditCardUseCase(): { execute: ReturnType<typeof vi.fn> } {
  return {
    execute: vi.fn(),
  }
}

function createCreditCardSupabaseMock(
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
                  single: vi.fn().mockResolvedValue({ data: creditCard, error: null }),
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

describe('executeUpdateCreditCard', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let mockUpdateCreditCardUseCase: ReturnType<typeof createMockUpdateCreditCardUseCase>
  let context: FunctionExecutionContext

  const userId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = createMockSupabase()
    mockUpdateCreditCardUseCase = createMockUpdateCreditCardUseCase()

    context = {
      userId,
      supabase: mockSupabase as never,
      createExpenseUseCase: {} as unknown as CreateExpenseUseCase,
      expensesRepository: {} as unknown as ExpensesRepository,
      updateCreditCardUseCase: mockUpdateCreditCardUseCase as unknown as UpdateCreditCardUseCase,
      getOrCreateInvoiceUseCase: {} as unknown as GetOrCreateInvoiceUseCase,
      getCreditCardLimitUsageUseCase: {} as unknown as GetCreditCardLimitUsageUseCase,
      payInvoiceUseCase: {} as unknown as PayInvoiceUseCase,
      invoicesRepository: {} as unknown as InvoicesRepository,
      creditCardsRepository: {} as unknown as CreditCardsRepository,
    }
  })

  it('updates closing_day only', async () => {
    const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
    const updatedCard = createMockCreditCard({ id: 'card-1', name: 'Nubank', closing_day: 15 })

    createCreditCardSupabaseMock(mockSupabase, creditCard)
    mockUpdateCreditCardUseCase.execute.mockResolvedValue(updatedCard)

    const result = await executeFunction(
      {
        name: 'update_credit_card',
        args: {
          credit_card_name: 'Nubank',
          closing_day: 15,
        },
      },
      context
    )

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('credit_card_updated')
    expect(result.message).toContain('Nubank')
    expect(result.message).toContain('dia de fechamento')
    expect(result.message).toContain('15')
    expect(mockUpdateCreditCardUseCase.execute).toHaveBeenCalledWith(userId, 'card-1', {
      closing_day: 15,
    })
  })

  it('updates credit_limit_cents only', async () => {
    const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
    const updatedCard = createMockCreditCard({
      id: 'card-1',
      name: 'Nubank',
      credit_limit_cents: 500000,
    })

    createCreditCardSupabaseMock(mockSupabase, creditCard)
    mockUpdateCreditCardUseCase.execute.mockResolvedValue(updatedCard)

    const result = await executeFunction(
      {
        name: 'update_credit_card',
        args: {
          credit_card_name: 'Nubank',
          credit_limit_cents: 500000,
        },
      },
      context
    )

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('credit_card_updated')
    expect(result.message).toContain('Nubank')
    expect(result.message).toContain('limite')
    expect(result.message).toContain('R$')
    expect(mockUpdateCreditCardUseCase.execute).toHaveBeenCalledWith(userId, 'card-1', {
      credit_limit_cents: 500000,
    })
  })

  it('updates both closing_day and credit_limit_cents at once', async () => {
    const creditCard = createMockCreditCard({ id: 'card-1', name: 'Itau' })
    const updatedCard = createMockCreditCard({
      id: 'card-1',
      name: 'Itau',
      closing_day: 10,
      credit_limit_cents: 800000,
    })

    createCreditCardSupabaseMock(mockSupabase, creditCard)
    mockUpdateCreditCardUseCase.execute.mockResolvedValue(updatedCard)

    const result = await executeFunction(
      {
        name: 'update_credit_card',
        args: {
          credit_card_name: 'Itau',
          closing_day: 10,
          credit_limit_cents: 800000,
        },
      },
      context
    )

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('credit_card_updated')
    expect(result.message).toContain('Itau')
    expect(result.message).toContain('dia de fechamento')
    expect(result.message).toContain('limite')
    expect(mockUpdateCreditCardUseCase.execute).toHaveBeenCalledWith(userId, 'card-1', {
      closing_day: 10,
      credit_limit_cents: 800000,
    })
  })

  it('returns error when card not found', async () => {
    createCreditCardSupabaseMock(mockSupabase, null)

    const result = await executeFunction(
      {
        name: 'update_credit_card',
        args: {
          credit_card_name: 'CartaoInexistente',
          closing_day: 15,
        },
      },
      context
    )

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('CartaoInexistente')
    expect(mockUpdateCreditCardUseCase.execute).not.toHaveBeenCalled()
  })

  it('returns error when params are invalid', async () => {
    const result = await executeFunction(
      {
        name: 'update_credit_card',
        args: {
          closing_day: 15,
        },
      },
      context
    )

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(mockUpdateCreditCardUseCase.execute).not.toHaveBeenCalled()
  })

  it('returns error when no fields to update are provided', async () => {
    const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
    createCreditCardSupabaseMock(mockSupabase, creditCard)

    const result = await executeFunction(
      {
        name: 'update_credit_card',
        args: {
          credit_card_name: 'Nubank',
        },
      },
      context
    )

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('Nenhuma alteração')
    expect(mockUpdateCreditCardUseCase.execute).not.toHaveBeenCalled()
  })

  it('returns error when use case throws', async () => {
    const creditCard = createMockCreditCard({ id: 'card-1', name: 'Nubank' })
    createCreditCardSupabaseMock(mockSupabase, creditCard)
    mockUpdateCreditCardUseCase.execute.mockRejectedValue(new Error('Database error'))

    const result = await executeFunction(
      {
        name: 'update_credit_card',
        args: {
          credit_card_name: 'Nubank',
          closing_day: 15,
        },
      },
      context
    )

    expect(result.success).toBe(false)
    expect(result.actionType).toBe('error')
    expect(result.message).toContain('Não consegui atualizar')
  })
})
