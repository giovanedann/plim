import { ERROR_CODES, HTTP_STATUS } from '@myfinances/shared'
import type { CreateExpense, Expense } from '@myfinances/shared'
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
  ): Promise<Expense> {
    const data: CreateExpenseData = {
      category_id: input.category_id,
      description: input.description,
      amount_cents: input.amount_cents,
      payment_method: input.payment_method,
      date: input.recurrence_start,
      is_recurrent: true,
      recurrence_day: input.recurrence_day,
      recurrence_start: input.recurrence_start,
      recurrence_end: input.recurrence_end ?? null,
    }

    const expense = await this.expensesRepository.create(userId, data)

    if (!expense) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create recurrent expense',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return expense
  }

  private async createInstallments(
    userId: string,
    input: Extract<CreateExpense, { type: 'installment' }>
  ): Promise<Expense[]> {
    const groupId = crypto.randomUUID()
    const installments: CreateExpenseData[] = []

    const baseDate = new Date(input.date)

    for (let i = 0; i < input.installment_total; i++) {
      const installmentDate = new Date(baseDate)
      installmentDate.setMonth(installmentDate.getMonth() + i)

      installments.push({
        category_id: input.category_id,
        description: input.description,
        amount_cents: input.amount_cents,
        payment_method: input.payment_method,
        date: installmentDate.toISOString().slice(0, 10),
        is_recurrent: false,
        installment_current: i + 1,
        installment_total: input.installment_total,
        installment_group_id: groupId,
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
}
