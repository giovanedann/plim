import { updateSalaryFunctionParamsSchema } from '@plim/shared'
import { tool } from 'ai'
import { formatCurrency } from './helpers'
import type { ActionResult, ToolContext } from './types'

export function createUpdateSalaryTool(ctx: ToolContext) {
  return tool({
    description:
      'Updates the user registered salary. Use when the user wants to set or change their monthly salary.',
    inputSchema: updateSalaryFunctionParamsSchema,
    execute: async ({ amount_cents, effective_from }): Promise<ActionResult> => {
      const now = new Date()
      const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const resolvedEffectiveFrom = effective_from ?? firstDayOfMonth

      try {
        const salary = await ctx.createSalaryUseCase.execute(ctx.userId, {
          amount_cents,
          effective_from: resolvedEffectiveFrom,
        })

        return {
          success: true,
          message: `Salário atualizado para ${formatCurrency(salary.amount_cents)} a partir de ${resolvedEffectiveFrom}.`,
          data: salary,
          actionType: 'salary_updated',
        }
      } catch {
        return {
          success: false,
          message: 'Não consegui atualizar o salário. Tente novamente.',
          actionType: 'error',
        }
      }
    },
  })
}
