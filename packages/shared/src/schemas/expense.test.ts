import { describe, expect, it } from 'vitest'
import {
  createExpenseSchema,
  createIncomeSchema,
  expenseFiltersSchema,
  expenseSchema,
  expenseTypeSchema,
  paginatedExpenseFiltersSchema,
  paymentMethodSchema,
  transactionTypeSchema,
  updateExpenseSchema,
} from './expense'

describe('paymentMethodSchema', () => {
  const sut = paymentMethodSchema

  it.each(['credit_card', 'debit_card', 'pix', 'cash'] as const)(
    'accepts valid payment method: %s',
    (method) => {
      const result = sut.safeParse(method)

      expect(result.success).toBe(true)
    }
  )

  it('rejects invalid payment method', () => {
    const result = sut.safeParse('bank_transfer')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Selecione um método de pagamento válido')
    }
  })
})

describe('expenseTypeSchema', () => {
  const sut = expenseTypeSchema

  it.each(['one_time', 'recurrent', 'installment'] as const)(
    'accepts valid expense type: %s',
    (type) => {
      const result = sut.safeParse(type)

      expect(result.success).toBe(true)
    }
  )

  it('rejects invalid expense type', () => {
    const result = sut.safeParse('subscription')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Selecione um tipo de despesa válido')
    }
  })
})

describe('transactionTypeSchema', () => {
  const sut = transactionTypeSchema

  it.each(['expense', 'income'] as const)('accepts valid transaction type: %s', (type) => {
    const result = sut.safeParse(type)

    expect(result.success).toBe(true)
  })

  it('rejects invalid transaction type', () => {
    const result = sut.safeParse('transfer')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Selecione um tipo de transação válido')
    }
  })
})

describe('expenseSchema', () => {
  const sut = expenseSchema

  it('accepts expense with type field', () => {
    const expense = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      type: 'expense',
      category_id: '550e8400-e29b-41d4-a716-446655440002',
      description: 'Grocery shopping',
      amount_cents: 5000,
      payment_method: 'pix',
      date: '2024-01-15',
      is_recurrent: false,
      recurrence_day: null,
      recurrence_start: null,
      recurrence_end: null,
      installment_current: null,
      installment_total: null,
      installment_group_id: null,
      recurrent_group_id: null,
      credit_card_id: null,
      invoice_id: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    }

    const result = sut.safeParse(expense)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('expense')
    }
  })

  it('defaults type to expense when not provided', () => {
    const expense = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      category_id: '550e8400-e29b-41d4-a716-446655440002',
      description: 'Grocery shopping',
      amount_cents: 5000,
      payment_method: 'pix',
      date: '2024-01-15',
      is_recurrent: false,
      recurrence_day: null,
      recurrence_start: null,
      recurrence_end: null,
      installment_current: null,
      installment_total: null,
      installment_group_id: null,
      recurrent_group_id: null,
      credit_card_id: null,
      invoice_id: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    }

    const result = sut.safeParse(expense)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('expense')
    }
  })

  it('accepts income with nullable category_id', () => {
    const income = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      type: 'income',
      category_id: null,
      description: 'Salary',
      amount_cents: 500000,
      payment_method: 'pix',
      date: '2024-01-15',
      is_recurrent: false,
      recurrence_day: null,
      recurrence_start: null,
      recurrence_end: null,
      installment_current: null,
      installment_total: null,
      installment_group_id: null,
      recurrent_group_id: null,
      credit_card_id: null,
      invoice_id: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    }

    const result = sut.safeParse(income)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('income')
      expect(result.data.category_id).toBeNull()
    }
  })
})

describe('createExpenseSchema', () => {
  const sut = createExpenseSchema

  describe('one_time expense', () => {
    const validOneTimeExpense = {
      type: 'one_time' as const,
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Grocery shopping',
      amount_cents: 5000,
      payment_method: 'pix' as const,
      date: '2024-01-15',
    }

    it('accepts valid one_time expense', () => {
      const result = sut.safeParse(validOneTimeExpense)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validOneTimeExpense)
      }
    })

    it('accepts one_time expense with optional credit_card_id', () => {
      const expense = {
        ...validOneTimeExpense,
        payment_method: 'credit_card' as const,
        credit_card_id: '550e8400-e29b-41d4-a716-446655440001',
      }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(true)
    })

    it('accepts one_time expense with description at minimum length (1 character)', () => {
      const expense = { ...validOneTimeExpense, description: 'a' }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(true)
    })

    it('rejects one_time expense with empty description', () => {
      const expense = { ...validOneTimeExpense, description: '' }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Descrição é obrigatória')
      }
    })

    it('accepts one_time expense with description at maximum length (255 characters)', () => {
      const expense = { ...validOneTimeExpense, description: 'a'.repeat(255) }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(true)
    })

    it('rejects one_time expense with description exceeding 255 characters', () => {
      const expense = { ...validOneTimeExpense, description: 'a'.repeat(256) }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Descrição deve ter no máximo 255 caracteres')
      }
    })

    it('accepts one_time expense with amount at minimum value (1 cent)', () => {
      const expense = { ...validOneTimeExpense, amount_cents: 1 }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(true)
    })

    it('rejects one_time expense with zero amount', () => {
      const expense = { ...validOneTimeExpense, amount_cents: 0 }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Valor deve ser maior que zero')
      }
    })

    it('rejects one_time expense with negative amount', () => {
      const expense = { ...validOneTimeExpense, amount_cents: -100 }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Valor deve ser maior que zero')
      }
    })

    it('rejects one_time expense with invalid category_id', () => {
      const expense = { ...validOneTimeExpense, category_id: 'invalid-uuid' }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Selecione uma categoria')
      }
    })

    it('rejects one_time expense with invalid date format', () => {
      const expense = { ...validOneTimeExpense, date: '15-01-2024' }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Selecione uma data válida')
      }
    })
  })

  describe('recurrent expense', () => {
    const validRecurrentExpense = {
      type: 'recurrent' as const,
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Netflix subscription',
      amount_cents: 3990,
      payment_method: 'credit_card' as const,
      recurrence_day: 15,
      recurrence_start: '2024-01-01',
    }

    it('accepts valid recurrent expense', () => {
      const result = sut.safeParse(validRecurrentExpense)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validRecurrentExpense)
      }
    })

    it('accepts recurrent expense with optional recurrence_end', () => {
      const expense = {
        ...validRecurrentExpense,
        recurrence_end: '2024-12-31',
      }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(true)
    })

    it('rejects recurrent expense with recurrence_day below 1', () => {
      const expense = { ...validRecurrentExpense, recurrence_day: 0 }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Dia deve ser entre 1 e 31')
      }
    })

    it('rejects recurrent expense with recurrence_day above 31', () => {
      const expense = { ...validRecurrentExpense, recurrence_day: 32 }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Dia deve ser entre 1 e 31')
      }
    })

    it('rejects recurrent expense without recurrence_start', () => {
      const { recurrence_start: _, ...expense } = validRecurrentExpense

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
    })

    it('rejects recurrent expense with invalid recurrence_start format', () => {
      const expense = { ...validRecurrentExpense, recurrence_start: '2024/01/01' }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Selecione a data de início')
      }
    })
  })

  describe('installment expense', () => {
    const validInstallmentExpense = {
      type: 'installment' as const,
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      description: 'New laptop',
      amount_cents: 500000,
      payment_method: 'credit_card' as const,
      date: '2024-01-15',
      installment_total: 12,
    }

    it('accepts valid installment expense', () => {
      const result = sut.safeParse(validInstallmentExpense)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validInstallmentExpense)
      }
    })

    it('accepts installment expense with minimum installments (2)', () => {
      const expense = { ...validInstallmentExpense, installment_total: 2 }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(true)
    })

    it('accepts installment expense with maximum installments (48)', () => {
      const expense = { ...validInstallmentExpense, installment_total: 48 }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(true)
    })

    it('rejects installment expense with installment_total below 2', () => {
      const expense = { ...validInstallmentExpense, installment_total: 1 }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Número de parcelas deve ser entre 2 e 48')
      }
    })

    it('rejects installment expense with installment_total above 48', () => {
      const expense = { ...validInstallmentExpense, installment_total: 49 }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Número de parcelas deve ser entre 2 e 48')
      }
    })

    it('rejects installment expense without installment_total', () => {
      const { installment_total: _, ...expense } = validInstallmentExpense

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
    })
  })

  describe('income', () => {
    const validIncome = {
      type: 'income' as const,
      description: 'Salary payment',
      amount_cents: 500000,
      date: '2024-01-15',
      payment_method: 'pix' as const,
    }

    it('accepts valid income', () => {
      const result = sut.safeParse(validIncome)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validIncome)
      }
    })

    it('accepts income with cash payment method', () => {
      const income = {
        ...validIncome,
        payment_method: 'cash' as const,
      }

      const result = sut.safeParse(income)

      expect(result.success).toBe(true)
    })

    it('rejects income with credit_card payment method', () => {
      const income = {
        ...validIncome,
        payment_method: 'credit_card',
      }

      const result = sut.safeParse(income)

      expect(result.success).toBe(false)
    })

    it('does not require category_id', () => {
      const result = sut.safeParse(validIncome)

      expect(result.success).toBe(true)
    })

    it('rejects income with empty description', () => {
      const income = { ...validIncome, description: '' }

      const result = sut.safeParse(income)

      expect(result.success).toBe(false)
    })

    it('rejects income with zero amount', () => {
      const income = { ...validIncome, amount_cents: 0 }

      const result = sut.safeParse(income)

      expect(result.success).toBe(false)
    })

    it('rejects income with invalid date', () => {
      const income = { ...validIncome, date: '15-01-2024' }

      const result = sut.safeParse(income)

      expect(result.success).toBe(false)
    })
  })

  describe('discriminated union', () => {
    it('rejects expense with invalid type', () => {
      const expense = {
        type: 'subscription',
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Test',
        amount_cents: 1000,
        payment_method: 'pix',
        date: '2024-01-15',
      }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
    })

    it('rejects expense without type', () => {
      const expense = {
        category_id: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Test',
        amount_cents: 1000,
        payment_method: 'pix',
        date: '2024-01-15',
      }

      const result = sut.safeParse(expense)

      expect(result.success).toBe(false)
    })
  })
})

describe('createIncomeSchema', () => {
  const sut = createIncomeSchema

  const validIncome = {
    type: 'income' as const,
    description: 'Freelance work',
    amount_cents: 250000,
    date: '2024-01-15',
    payment_method: 'pix' as const,
  }

  it('accepts valid income', () => {
    const result = sut.safeParse(validIncome)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validIncome)
    }
  })

  it('accepts income with cash payment method', () => {
    const income = { ...validIncome, payment_method: 'cash' as const }

    const result = sut.safeParse(income)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.payment_method).toBe('cash')
    }
  })

  it('rejects income with credit_card payment method', () => {
    const income = { ...validIncome, payment_method: 'credit_card' }

    const result = sut.safeParse(income)

    expect(result.success).toBe(false)
  })

  it('rejects income with wrong type literal', () => {
    const income = { ...validIncome, type: 'expense' }

    const result = sut.safeParse(income)

    expect(result.success).toBe(false)
  })

  it('rejects income without required description', () => {
    const { description: _, ...income } = validIncome

    const result = sut.safeParse(income)

    expect(result.success).toBe(false)
  })

  it('rejects income without required amount_cents', () => {
    const { amount_cents: _, ...income } = validIncome

    const result = sut.safeParse(income)

    expect(result.success).toBe(false)
  })

  it('rejects income without required date', () => {
    const { date: _, ...income } = validIncome

    const result = sut.safeParse(income)

    expect(result.success).toBe(false)
  })
})

describe('updateExpenseSchema', () => {
  const sut = updateExpenseSchema

  it('accepts partial update with single field', () => {
    const result = sut.safeParse({ description: 'Updated description' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ description: 'Updated description' })
    }
  })

  it('accepts partial update with multiple fields', () => {
    const update = {
      description: 'Updated description',
      amount_cents: 7500,
      payment_method: 'debit_card' as const,
    }

    const result = sut.safeParse(update)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(update)
    }
  })

  it('accepts empty object (no updates)', () => {
    const result = sut.safeParse({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({})
    }
  })

  it('accepts update with category_id', () => {
    const result = sut.safeParse({
      category_id: '550e8400-e29b-41d4-a716-446655440000',
    })

    expect(result.success).toBe(true)
  })

  it('accepts update with date', () => {
    const result = sut.safeParse({ date: '2024-02-20' })

    expect(result.success).toBe(true)
  })

  it('accepts update with recurrence_end', () => {
    const result = sut.safeParse({ recurrence_end: '2024-12-31' })

    expect(result.success).toBe(true)
  })

  it('accepts update with credit_card_id', () => {
    const result = sut.safeParse({
      credit_card_id: '550e8400-e29b-41d4-a716-446655440001',
    })

    expect(result.success).toBe(true)
  })

  it('rejects update with invalid amount_cents', () => {
    const result = sut.safeParse({ amount_cents: -100 })

    expect(result.success).toBe(false)
  })

  it('rejects update with empty description', () => {
    const result = sut.safeParse({ description: '' })

    expect(result.success).toBe(false)
  })

  it('rejects update with invalid payment_method', () => {
    const result = sut.safeParse({ payment_method: 'wire_transfer' })

    expect(result.success).toBe(false)
  })
})

describe('expenseFiltersSchema', () => {
  const sut = expenseFiltersSchema

  it('accepts empty filters', () => {
    const result = sut.safeParse({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({})
    }
  })

  it('accepts filters with start_date', () => {
    const result = sut.safeParse({ start_date: '2024-01-01' })

    expect(result.success).toBe(true)
  })

  it('accepts filters with end_date', () => {
    const result = sut.safeParse({ end_date: '2024-12-31' })

    expect(result.success).toBe(true)
  })

  it('accepts filters with date range', () => {
    const filters = {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    }

    const result = sut.safeParse(filters)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(filters)
    }
  })

  it('accepts filters with category_id', () => {
    const result = sut.safeParse({
      category_id: '550e8400-e29b-41d4-a716-446655440000',
    })

    expect(result.success).toBe(true)
  })

  it('accepts filters with payment_method', () => {
    const result = sut.safeParse({ payment_method: 'credit_card' })

    expect(result.success).toBe(true)
  })

  it('accepts filters with expense_type', () => {
    const result = sut.safeParse({ expense_type: 'recurrent' })

    expect(result.success).toBe(true)
  })

  it('accepts filters with credit_card_id as UUID', () => {
    const result = sut.safeParse({
      credit_card_id: '550e8400-e29b-41d4-a716-446655440000',
    })

    expect(result.success).toBe(true)
  })

  it('accepts filters with credit_card_id as "none"', () => {
    const result = sut.safeParse({ credit_card_id: 'none' })

    expect(result.success).toBe(true)
    expect(result.data?.credit_card_id).toBe('none')
  })

  it('accepts filters with transaction_type expense', () => {
    const result = sut.safeParse({ transaction_type: 'expense' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.transaction_type).toBe('expense')
    }
  })

  it('accepts filters with transaction_type income', () => {
    const result = sut.safeParse({ transaction_type: 'income' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.transaction_type).toBe('income')
    }
  })

  it('rejects filters with invalid transaction_type', () => {
    const result = sut.safeParse({ transaction_type: 'transfer' })

    expect(result.success).toBe(false)
  })

  it('accepts all filters combined', () => {
    const filters = {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      payment_method: 'credit_card' as const,
      expense_type: 'installment' as const,
      credit_card_id: '550e8400-e29b-41d4-a716-446655440001',
      transaction_type: 'expense' as const,
    }

    const result = sut.safeParse(filters)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(filters)
    }
  })

  it('rejects invalid date format', () => {
    const result = sut.safeParse({ start_date: '01-01-2024' })

    expect(result.success).toBe(false)
  })

  it('rejects invalid credit_card_id', () => {
    const result = sut.safeParse({ credit_card_id: 'invalid' })

    expect(result.success).toBe(false)
  })
})

describe('paginatedExpenseFiltersSchema', () => {
  const sut = paginatedExpenseFiltersSchema

  it('applies default page and limit when not provided', () => {
    const result = sut.safeParse({})

    expect(result.success).toBe(true)
    expect(result.data?.page).toBe(1)
    expect(result.data?.limit).toBe(20)
  })

  it('accepts custom page number', () => {
    const result = sut.safeParse({ page: 5 })

    expect(result.success).toBe(true)
    expect(result.data?.page).toBe(5)
  })

  it('accepts custom limit', () => {
    const result = sut.safeParse({ limit: 50 })

    expect(result.success).toBe(true)
    expect(result.data?.limit).toBe(50)
  })

  it('coerces string page to number', () => {
    const result = sut.safeParse({ page: '3' })

    expect(result.success).toBe(true)
    expect(result.data?.page).toBe(3)
  })

  it('coerces string limit to number', () => {
    const result = sut.safeParse({ limit: '25' })

    expect(result.success).toBe(true)
    expect(result.data?.limit).toBe(25)
  })

  it('rejects page below 1', () => {
    const result = sut.safeParse({ page: 0 })

    expect(result.success).toBe(false)
  })

  it('rejects negative page', () => {
    const result = sut.safeParse({ page: -1 })

    expect(result.success).toBe(false)
  })

  it('rejects limit below 10', () => {
    const result = sut.safeParse({ limit: 5 })

    expect(result.success).toBe(false)
  })

  it('rejects limit above 100', () => {
    const result = sut.safeParse({ limit: 150 })

    expect(result.success).toBe(false)
  })

  it('accepts minimum limit of 10', () => {
    const result = sut.safeParse({ limit: 10 })

    expect(result.success).toBe(true)
    expect(result.data?.limit).toBe(10)
  })

  it('accepts maximum limit of 100', () => {
    const result = sut.safeParse({ limit: 100 })

    expect(result.success).toBe(true)
    expect(result.data?.limit).toBe(100)
  })

  it('inherits all filter fields from expenseFiltersSchema', () => {
    const filters = {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      payment_method: 'pix' as const,
      expense_type: 'one_time' as const,
      page: 2,
      limit: 30,
    }

    const result = sut.safeParse(filters)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(filters)
    }
  })
})
