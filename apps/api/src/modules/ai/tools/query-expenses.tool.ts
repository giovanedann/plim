import { queryExpensesFunctionParamsSchema } from '@plim/shared'
import { tool } from 'ai'
import { findCategoryByName, findCreditCardByName, formatCurrency, groupExpenses } from './helpers'
import type { ActionResult, ToolContext } from './types'

export function createQueryExpensesTool(ctx: ToolContext) {
  return tool({
    description:
      'Query expenses with optional filters by date range, category, payment method, credit card, and grouping',
    inputSchema: queryExpensesFunctionParamsSchema,
    execute: async (params): Promise<ActionResult> => {
      let categoryId: string | undefined
      if (params.category_name) {
        const category = await findCategoryByName(ctx.supabase, ctx.userId, params.category_name)
        if (category) {
          categoryId = category.id
        }
      }

      let creditCardId: string | undefined
      if (params.credit_card_name) {
        const creditCard = await findCreditCardByName(
          ctx.supabase,
          ctx.userId,
          params.credit_card_name
        )
        if (creditCard) {
          creditCardId = creditCard.id
        }
      }

      const expenses = await ctx.expensesRepository.findByUserId(ctx.userId, {
        start_date: params.start_date,
        end_date: params.end_date,
        category_id: categoryId,
        payment_method: params.payment_method,
        credit_card_id: creditCardId,
      })

      const total = expenses.reduce((sum, e) => sum + e.amount_cents, 0)
      const formattedTotal = formatCurrency(total)

      let baseMessage: string
      if (params.credit_card_name) {
        baseMessage = `Seus gastos no cartão ${params.credit_card_name}`
      } else if (params.category_name) {
        baseMessage = `Seus gastos com ${params.category_name}`
      } else if (params.payment_method) {
        const methodNames: Record<string, string> = {
          credit_card: 'cartão de crédito',
          debit_card: 'cartão de débito',
          pix: 'Pix',
          cash: 'dinheiro',
        }
        baseMessage = `Seus gastos com ${methodNames[params.payment_method] || params.payment_method}`
      } else if (params.start_date && params.end_date) {
        baseMessage = 'Total de gastos no período'
      } else {
        baseMessage = 'Total de gastos'
      }

      const message = `${baseMessage}: ${formattedTotal} (${expenses.length} despesas)`

      let groupedData: Record<string, { total: number; count: number }> | undefined
      if (params.group_by && expenses.length > 0) {
        groupedData = groupExpenses(expenses, params.group_by)
      }

      return {
        success: true,
        message,
        data: {
          total,
          count: expenses.length,
          expenses: expenses.slice(0, 10),
          grouped: groupedData,
        },
        actionType: 'query_result',
      }
    },
  })
}
