import { type CreateExpense, createExpenseFunctionParamsSchema } from '@plim/shared'
import { tool } from 'ai'
import { findCategoryByName, findCreditCardByName, formatCurrency } from './helpers'
import type { ActionResult, ToolContext } from './types'

export function createCreateExpenseTool(ctx: ToolContext) {
  return tool({
    description:
      'Creates a new expense or income transaction. Supports one-time, installment, and recurrent expenses, as well as income entries.',
    inputSchema: createExpenseFunctionParamsSchema,
    execute: async (params): Promise<ActionResult> => {
      const isIncome = params.transaction_type === 'income'

      let categoryId: string | undefined
      if (params.category_name) {
        const category = await findCategoryByName(ctx.supabase, ctx.userId, params.category_name)
        if (!category) {
          return {
            success: false,
            message: `Não encontrei a categoria "${params.category_name}". Você pode criar ela primeiro ou escolher outra.`,
            actionType: 'error',
          }
        }
        categoryId = category.id
      } else if (!isIncome) {
        return {
          success: false,
          message: 'Categoria é obrigatória para despesas. Qual categoria deseja usar?',
          actionType: 'error',
        }
      }

      let creditCardId: string | undefined
      if (params.payment_method === 'credit_card' && params.credit_card_name) {
        const creditCard = await findCreditCardByName(
          ctx.supabase,
          ctx.userId,
          params.credit_card_name
        )
        if (!creditCard) {
          return {
            success: false,
            message: `Não encontrei o cartão "${params.credit_card_name}". Você pode cadastrar ele primeiro ou escolher outro.`,
            actionType: 'error',
          }
        }
        creditCardId = creditCard.id
      }

      let createExpenseInput: CreateExpense

      if (isIncome) {
        const incomePaymentMethod =
          params.payment_method === 'pix' || params.payment_method === 'cash'
            ? params.payment_method
            : 'pix'
        createExpenseInput = {
          type: 'income',
          description: params.description,
          amount_cents: params.amount_cents,
          date: params.date,
          payment_method: incomePaymentMethod,
        }
      } else if (params.installment_total && params.installment_total >= 2) {
        createExpenseInput = {
          type: 'installment',
          category_id: categoryId!,
          description: params.description,
          amount_cents: params.amount_cents,
          payment_method: params.payment_method,
          date: params.date,
          installment_total: params.installment_total,
          credit_card_id: creditCardId,
        }
      } else if (params.is_recurrent && params.recurrence_day) {
        createExpenseInput = {
          type: 'recurrent',
          category_id: categoryId!,
          description: params.description,
          amount_cents: params.amount_cents,
          payment_method: params.payment_method,
          recurrence_day: params.recurrence_day,
          recurrence_start: params.date,
          credit_card_id: creditCardId,
        }
      } else {
        createExpenseInput = {
          type: 'one_time',
          category_id: categoryId!,
          description: params.description,
          amount_cents: params.amount_cents,
          payment_method: params.payment_method,
          date: params.date,
          credit_card_id: creditCardId,
        }
      }

      try {
        const result = await ctx.createExpenseUseCase.execute(ctx.userId, createExpenseInput)
        const expenses = Array.isArray(result) ? result : [result]
        const expense = expenses[0]

        const formattedAmount = formatCurrency(params.amount_cents)
        const label = isIncome ? 'Receita' : 'Despesa'
        let message: string

        if (isIncome) {
          message = `Receita registrada: ${params.description} de ${formattedAmount}`
        } else if (params.installment_total && params.installment_total >= 2) {
          const installmentAmount = formatCurrency(
            Math.ceil(params.amount_cents / params.installment_total)
          )
          message = `${label} criada: ${params.description} de ${formattedAmount} em ${params.installment_total}x de ${installmentAmount}`
        } else if (params.is_recurrent) {
          message = `${label} recorrente criada: ${params.description} de ${formattedAmount} todo dia ${params.recurrence_day}`
        } else {
          message = `${label} criada: ${params.description} de ${formattedAmount}`
        }

        return {
          success: true,
          message,
          data: expense,
          actionType: 'expense_created',
        }
      } catch (_error) {
        return {
          success: false,
          message: `Não consegui criar a ${isIncome ? 'receita' : 'despesa'}. Tente novamente.`,
          actionType: 'error',
        }
      }
    },
  })
}
