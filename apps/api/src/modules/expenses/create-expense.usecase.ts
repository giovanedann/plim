import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { CreateExpense, Expense } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreateExpenseData, ExpensesRepository } from './expenses.repository'

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
          category_id: input.category_id,
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
        })
      }

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    if (records.length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'No recurrent expenses to create in the valid date range',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const expenses = await this.expensesRepository.createMany(userId, records)

    if (expenses.length === 0) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create recurrent expenses',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return expenses
  }

  private async createInstallments(
    userId: string,
    input: Extract<CreateExpense, { type: 'installment' }>
  ): Promise<Expense[]> {
    const groupId = crypto.randomUUID()
    const installments: CreateExpenseData[] = []

    const baseDate = new Date(input.date)
    const installmentAmount = Math.ceil(input.amount_cents / input.installment_total)

    for (let i = 0; i < input.installment_total; i++) {
      const installmentDate = new Date(baseDate)
      installmentDate.setMonth(installmentDate.getMonth() + i)

      installments.push({
        category_id: input.category_id,
        description: input.description,
        amount_cents: installmentAmount,
        payment_method: input.payment_method,
        date: installmentDate.toISOString().slice(0, 10),
        is_recurrent: false,
        installment_current: i + 1,
        installment_total: input.installment_total,
        installment_group_id: groupId,
        credit_card_id: input.credit_card_id ?? null,
      })
    }

    const expenses = await this.expensesRepository.createMany(userId, installments)

    if (expenses.length === 0) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create installment expenses',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return expenses
  }

  private async createIncome(
    userId: string,
    input: Extract<CreateExpense, { type: 'income' }>
  ): Promise<Expense> {
    const data: CreateExpenseData = {
      description: input.description,
      amount_cents: input.amount_cents,
      payment_method: input.payment_method ?? 'pix',
      date: input.date,
      type: 'income',
      is_recurrent: false,
      credit_card_id: input.credit_card_id ?? null,
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
}
