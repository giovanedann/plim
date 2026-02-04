import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { Expense, UpdateExpense } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'

export class UpdateExpenseUseCase {
  constructor(private expensesRepository: ExpensesRepository) {}

  async execute(userId: string, expenseId: string, input: UpdateExpense): Promise<Expense> {
    const existing = await this.expensesRepository.findById(expenseId, userId)

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
    }

    const updated = await this.expensesRepository.update(expenseId, userId, input)

    if (!updated) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update expense',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    // If this is an installment expense and credit_card_id was updated,
    // propagate the change to all installments in the group
    if (
      existing.installment_group_id &&
      input.credit_card_id !== undefined &&
      input.credit_card_id !== existing.credit_card_id
    ) {
      await this.expensesRepository.updateByGroupId(existing.installment_group_id, userId, {
        credit_card_id: input.credit_card_id,
      })
    }

    // If this is a recurrent expense, propagate shared fields to all records in the group
    if (existing.recurrent_group_id) {
      const groupUpdates: Partial<UpdateExpense> = {}

      if (input.description !== undefined && input.description !== existing.description) {
        groupUpdates.description = input.description
      }
      if (input.amount_cents !== undefined && input.amount_cents !== existing.amount_cents) {
        groupUpdates.amount_cents = input.amount_cents
      }
      if (input.category_id !== undefined && input.category_id !== existing.category_id) {
        groupUpdates.category_id = input.category_id
      }
      if (input.credit_card_id !== undefined && input.credit_card_id !== existing.credit_card_id) {
        groupUpdates.credit_card_id = input.credit_card_id
      }
      if (input.payment_method !== undefined && input.payment_method !== existing.payment_method) {
        groupUpdates.payment_method = input.payment_method
      }
      if (input.recurrence_end !== undefined && input.recurrence_end !== existing.recurrence_end) {
        groupUpdates.recurrence_end = input.recurrence_end
      }

      if (Object.keys(groupUpdates).length > 0) {
        await this.expensesRepository.updateByRecurrentGroupId(
          existing.recurrent_group_id,
          userId,
          groupUpdates
        )
      }
    }

    return updated
  }
}
