import { type UpdateCreditCard, updateCreditCardFunctionParamsSchema } from '@plim/shared'
import { tool } from 'ai'
import { findCreditCardByName, formatCurrency } from './helpers'
import type { ActionResult, ToolContext } from './types'

export function createUpdateCreditCardTool(ctx: ToolContext) {
  return tool({
    description: 'Updates credit card settings like closing day or credit limit',
    inputSchema: updateCreditCardFunctionParamsSchema,
    execute: async ({
      credit_card_name,
      closing_day,
      credit_limit_cents,
    }): Promise<ActionResult> => {
      const creditCard = await findCreditCardByName(ctx.supabase, ctx.userId, credit_card_name)

      if (!creditCard) {
        return {
          success: false,
          message: `Não encontrei o cartão "${credit_card_name}". Verifique o nome e tente novamente.`,
          actionType: 'error',
        }
      }

      const updateInput: UpdateCreditCard = {}

      if (closing_day !== undefined) {
        updateInput.closing_day = closing_day
      }

      if (credit_limit_cents !== undefined) {
        updateInput.credit_limit_cents = credit_limit_cents
      }

      if (Object.keys(updateInput).length === 0) {
        return {
          success: false,
          message:
            'Nenhuma alteração foi informada. Informe o dia de fechamento ou o limite de crédito.',
          actionType: 'error',
        }
      }

      try {
        const updated = await ctx.updateCreditCardUseCase.execute(
          ctx.userId,
          creditCard.id,
          updateInput
        )

        const details: string[] = []
        if (closing_day !== undefined) {
          details.push(`dia de fechamento para ${closing_day}`)
        }
        if (credit_limit_cents !== undefined) {
          details.push(`limite para ${formatCurrency(credit_limit_cents)}`)
        }

        return {
          success: true,
          message: `Cartão ${updated.name} atualizado: ${details.join(' e ')}.`,
          data: updated,
          actionType: 'credit_card_updated',
        }
      } catch {
        return {
          success: false,
          message: 'Não consegui atualizar o cartão. Tente novamente.',
          actionType: 'error',
        }
      }
    },
  })
}
