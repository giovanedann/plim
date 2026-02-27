import { forecastSpendingFunctionParamsSchema } from '@plim/shared'
import { tool } from 'ai'
import { formatCurrency } from './helpers'
import type { ActionResult, ToolContext } from './types'

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

export function createForecastSpendingTool(ctx: ToolContext) {
  return tool({
    description:
      'Forecast future spending based on existing expenses, including one-time, recurrent, and installment expenses',
    inputSchema: forecastSpendingFunctionParamsSchema,
    execute: async (params): Promise<ActionResult> => {
      const monthsAhead = params.months_ahead ?? 3

      const now = new Date()
      const forecasts: Array<{
        month: string
        total: number
        breakdown: { oneTime: number; recurrent: number; installments: number }
      }> = []

      for (let i = 0; i < monthsAhead; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
        const monthStr = targetDate.toISOString().slice(0, 7)
        const startDate = `${monthStr}-01`
        const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate()
        const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`

        const expenses = await ctx.expensesRepository.findByUserId(ctx.userId, {
          start_date: startDate,
          end_date: endDate,
        })

        const oneTimeExpenses = expenses.filter(
          (e) => !e.is_recurrent && (!e.installment_total || e.installment_total <= 1)
        )
        const recurrentExpenses = expenses.filter((e) => e.is_recurrent)
        const installmentExpenses = expenses.filter(
          (e) => e.installment_total && e.installment_total > 1
        )

        const oneTimeTotal = oneTimeExpenses.reduce((sum, e) => sum + e.amount_cents, 0)
        const recurrentTotal =
          params.include_recurrent !== false
            ? recurrentExpenses.reduce((sum, e) => sum + e.amount_cents, 0)
            : 0
        const installmentsTotal =
          params.include_installments !== false
            ? installmentExpenses.reduce((sum, e) => sum + e.amount_cents, 0)
            : 0

        forecasts.push({
          month: monthStr,
          total: oneTimeTotal + recurrentTotal + installmentsTotal,
          breakdown: {
            oneTime: oneTimeTotal,
            recurrent: recurrentTotal,
            installments: installmentsTotal,
          },
        })
      }

      const grandTotal = forecasts.reduce((sum, f) => sum + f.total, 0)
      const formattedTotal = formatCurrency(grandTotal)

      const lastMonth = new Date(now.getFullYear(), now.getMonth() + monthsAhead - 1, 1)
      const lastMonthName = MONTH_NAMES[lastMonth.getMonth()]

      const message = `Previsão de gastos até ${lastMonthName}: ${formattedTotal}`

      return {
        success: true,
        message,
        data: {
          total: grandTotal,
          forecasts,
        },
        actionType: 'forecast_result',
      }
    },
  })
}
