import { payInvoiceFunctionParamsSchema } from '@plim/shared'
import { tool } from 'ai'
import { findCreditCardByName, formatCurrency } from './helpers'
import type { ActionResult, ToolContext } from './types'

export function createPayInvoiceTool(ctx: ToolContext) {
  return tool({
    description:
      'Register a full or partial payment for a credit card invoice. Can resolve the card automatically if the user has only one.',
    inputSchema: payInvoiceFunctionParamsSchema,
    execute: async (params): Promise<ActionResult> => {
      let creditCardId: string | undefined
      let cardName: string | undefined

      if (params.credit_card_name) {
        const creditCard = await findCreditCardByName(
          ctx.supabase,
          ctx.userId,
          params.credit_card_name
        )
        if (!creditCard) {
          return {
            success: false,
            message: `Não encontrei o cartão "${params.credit_card_name}". Verifique o nome e tente novamente.`,
            actionType: 'error',
          }
        }
        creditCardId = creditCard.id
        cardName = creditCard.name
      } else {
        const activeCards = await ctx.creditCardsRepository.findByUserId(ctx.userId)
        if (activeCards.length === 0) {
          return {
            success: false,
            message: 'Você não tem cartões de crédito cadastrados.',
            actionType: 'error',
          }
        }
        if (activeCards.length > 1) {
          return {
            success: false,
            message: 'Você tem mais de um cartão. Qual cartão deseja pagar a fatura?',
            actionType: 'error',
          }
        }
        creditCardId = activeCards[0]!.id
        cardName = activeCards[0]!.name
      }

      try {
        const { invoice } = await ctx.getOrCreateInvoiceUseCase.execute(
          ctx.userId,
          creditCardId,
          params.reference_month
        )

        const effectiveTotal = invoice.total_amount_cents + invoice.carry_over_cents
        const remaining = effectiveTotal - invoice.paid_amount_cents

        if (remaining <= 0) {
          return {
            success: true,
            message: `A fatura de ${params.reference_month} do cartão ${cardName} já está paga.`,
            data: invoice,
            actionType: 'invoice_paid',
          }
        }

        let amountCents: number

        if (params.pay_full || !params.amount_cents) {
          amountCents = remaining
        } else {
          amountCents = params.amount_cents
        }

        const updatedInvoice = await ctx.payInvoiceUseCase.execute(
          ctx.userId,
          invoice.id,
          amountCents
        )

        const formattedAmount = formatCurrency(amountCents)
        const isFullyPaid = updatedInvoice.status === 'paid'

        const message = isFullyPaid
          ? `Fatura de ${params.reference_month} do cartão ${cardName} paga integralmente: ${formattedAmount}.`
          : `Pagamento de ${formattedAmount} registrado na fatura de ${params.reference_month} do cartão ${cardName}. Restante: ${formatCurrency(remaining - amountCents)}.`

        return {
          success: true,
          message,
          data: updatedInvoice,
          actionType: 'invoice_paid',
        }
      } catch {
        return {
          success: false,
          message: 'Não consegui registrar o pagamento da fatura. Tente novamente.',
          actionType: 'error',
        }
      }
    },
  })
}
