import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { CreateExpense, Expense, PaymentMethod, TransactionType } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreateExpenseData, ExpensesRepository } from './expenses.repository'

interface RecurrentInput {
  description: string
  amount_cents: number
  payment_method: PaymentMethod
  recurrence_day: number
  recurrence_start: string
  recurrence_end?: string
  credit_card_id?: string
}

interface InstallmentInput {
  description: string
  amount_cents: number
  payment_method: PaymentMethod
  date: string
  installment_total: number
  credit_card_id?: string
}

function generateRecurrentRecords(
  input: RecurrentInput,
  groupId: string,
  overrides: Partial<CreateExpenseData>
): CreateExpenseData[] {
  const records: CreateExpenseData[] = []

  const today = new Date()
  const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate())
  const twoYearsAhead = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())

  const recurrenceStart = new Date(input.recurrence_start)
  const recurrenceEnd = input.recurrence_end ? new Date(input.recurrence_end) : null

  const startDate = recurrenceStart > twoYearsAgo ? recurrenceStart : twoYearsAgo
  const endDate = recurrenceEnd && recurrenceEnd < twoYearsAhead ? recurrenceEnd : twoYearsAhead

  const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)

  while (currentDate <= endDate) {
    const targetDay = Math.min(
      input.recurrence_day,
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    )
    const expenseDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), targetDay)

    if (expenseDate >= startDate && expenseDate <= endDate) {
      records.push({
        description: input.description,
        amount_cents: input.amount_cents,
        payment_method: input.payment_method,
        date: expenseDate.toISOString().slice(0, 10),
        is_recurrent: true,
        recurrence_day: input.recurrence_day,
        recurrence_start: input.recurrence_start,
        recurrence_end: input.recurrence_end ?? null,
        recurrent_group_id: groupId,
        credit_card_id: input.credit_card_id ?? null,
        ...overrides,
      })
    }

    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return records
}

function generateInstallmentRecords(
  input: InstallmentInput,
  groupId: string,
  overrides: Partial<CreateExpenseData>
): CreateExpenseData[] {
  const records: CreateExpenseData[] = []
  const baseDate = new Date(input.date)
  const installmentAmount = Math.ceil(input.amount_cents / input.installment_total)

  for (let i = 0; i < input.installment_total; i++) {
    const installmentDate = new Date(baseDate)
    installmentDate.setMonth(installmentDate.getMonth() + i)

    records.push({
      description: input.description,
      amount_cents: installmentAmount,
      payment_method: input.payment_method,
      date: installmentDate.toISOString().slice(0, 10),
      is_recurrent: false,
      installment_current: i + 1,
      installment_total: input.installment_total,
      installment_group_id: groupId,
      credit_card_id: input.credit_card_id ?? null,
      ...overrides,
    })
  }

  return records
}

export class CreateExpenseUseCase {
  constructor(private expensesRepository: ExpensesRepository) {}

  async execute(userId: string, input: CreateExpense): Promise<Expense | Expense[]> {
    switch (input.type) {
      case 'one_time':
        return this.createOneTime(userId, input)
      case 'recurrent':
        return this.createRecurrent(userId, input)
      case 'installment':
        return this.createInstallments(userId, input)
      case 'income':
        return this.createIncome(userId, input)
      case 'income_recurrent':
        return this.createRecurrentIncome(userId, input)
      case 'income_installment':
        return this.createIncomeInstallments(userId, input)
      default:
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Invalid expense type',
          HTTP_STATUS.BAD_REQUEST
        )
    }
  }

  private async createOneTime(
    userId: string,
    input: Extract<CreateExpense, { type: 'one_time' }>
  ): Promise<Expense> {
    const data: CreateExpenseData = {
      category_id: input.category_id,
      description: input.description,
      amount_cents: input.amount_cents,
      payment_method: input.payment_method,
      date: input.date,
      is_recurrent: false,
      credit_card_id: input.credit_card_id ?? null,
    }

    const expense = await this.expensesRepository.create(userId, data)

    if (!expense) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create expense',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return expense
  }

  private async createRecurrent(
    userId: string,
    input: Extract<CreateExpense, { type: 'recurrent' }>
  ): Promise<Expense[]> {
    const groupId = crypto.randomUUID()
    const records = generateRecurrentRecords(input, groupId, {
      category_id: input.category_id,
    })

    if (records.length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'No recurrent expenses to create in the valid date range',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    return this.createManyOrThrow(userId, records, 'Failed to create recurrent expenses')
  }

  private async createInstallments(
    userId: string,
    input: Extract<CreateExpense, { type: 'installment' }>
  ): Promise<Expense[]> {
    const groupId = crypto.randomUUID()
    const records = generateInstallmentRecords(input, groupId, {
      category_id: input.category_id,
    })

    return this.createManyOrThrow(userId, records, 'Failed to create installment expenses')
  }

  private async createIncome(
    userId: string,
    input: Extract<CreateExpense, { type: 'income' }>
  ): Promise<Expense> {
    const data: CreateExpenseData = {
      description: input.description,
      amount_cents: input.amount_cents,
      payment_method: input.payment_method,
      date: input.date,
      type: 'income' as TransactionType,
      is_recurrent: false,
    }

    const expense = await this.expensesRepository.create(userId, data)

    if (!expense) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create income',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return expense
  }

  private async createRecurrentIncome(
    userId: string,
    input: Extract<CreateExpense, { type: 'income_recurrent' }>
  ): Promise<Expense[]> {
    const groupId = crypto.randomUUID()
    const records = generateRecurrentRecords(input, groupId, {
      type: 'income' as TransactionType,
    })

    if (records.length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'No recurrent incomes to create in the valid date range',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    return this.createManyOrThrow(userId, records, 'Failed to create recurrent incomes')
  }

  private async createIncomeInstallments(
    userId: string,
    input: Extract<CreateExpense, { type: 'income_installment' }>
  ): Promise<Expense[]> {
    const groupId = crypto.randomUUID()
    const records = generateInstallmentRecords(input, groupId, {
      type: 'income' as TransactionType,
    })

    return this.createManyOrThrow(userId, records, 'Failed to create income installments')
  }

  private async createManyOrThrow(
    userId: string,
    records: CreateExpenseData[],
    errorMessage: string
  ): Promise<Expense[]> {
    const expenses = await this.expensesRepository.createMany(userId, records)

    if (expenses.length === 0) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        errorMessage,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return expenses
  }
}
