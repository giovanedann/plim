import { type CreditCard, queryInvoicesFunctionParamsSchema } from '@plim/shared'
import { tool } from 'ai'
import { findCreditCardByName, formatCurrency } from './helpers'
import type { ActionResult, ToolContext } from './types'

export function createQueryInvoicesTool(ctx: ToolContext) {
  return tool({
    description:
      'Query invoice details, credit limit usage, or open invoices for credit cards. Supports 3 query types: invoice_details (specific month), limit_usage (available credit), open_invoices (unpaid invoices)',
    inputSchema: queryInvoicesFunctionParamsSchema,
    execute: async (params): Promise<ActionResult> => {
      switch (params.query_type) {
        case 'invoice_details':
          return executeInvoiceDetails(params.credit_card_name, params.reference_month, ctx)
        case 'limit_usage':
          return executeLimitUsage(params.credit_card_name, ctx)
        case 'open_invoices':
          return executeOpenInvoices(params.credit_card_name, ctx)
        default:
          return {
            success: false,
            message: 'Tipo de consulta de fatura não reconhecido.',
            actionType: 'error',
          }
      }
    },
  })
}

async function executeInvoiceDetails(
  creditCardName: string | undefined,
  referenceMonth: string | undefined,
  ctx: ToolContext
): Promise<ActionResult> {
  if (!creditCardName) {
    return {
      success: false,
      message: 'Qual cartão de crédito você quer consultar a fatura?',
      actionType: 'error',
    }
  }

  const creditCard = await findCreditCardByName(ctx.supabase, ctx.userId, creditCardName)

  if (!creditCard) {
    return {
      success: false,
      message: `Não encontrei o cartão "${creditCardName}". Verifique o nome e tente novamente.`,
      actionType: 'error',
    }
  }

  const month = referenceMonth ?? new Date().toISOString().slice(0, 7)

  try {
    const result = await ctx.getOrCreateInvoiceUseCase.execute(ctx.userId, creditCard.id, month)

    const { invoice, transactions } = result
    const remaining =
      invoice.total_amount_cents + invoice.carry_over_cents - invoice.paid_amount_cents

    const statusLabels: Record<string, string> = {
      open: 'Aberta',
      partially_paid: 'Parcialmente paga',
      paid: 'Paga',
    }

    const message = [
      `Fatura ${creditCard.name} - ${month}:`,
      `Total: ${formatCurrency(invoice.total_amount_cents)}`,
      `Pago: ${formatCurrency(invoice.paid_amount_cents)}`,
      `Saldo anterior: ${formatCurrency(invoice.carry_over_cents)}`,
      `Restante: ${formatCurrency(remaining)}`,
      `Status: ${statusLabels[invoice.status] ?? invoice.status}`,
      `Transações: ${transactions.length}`,
    ].join('\n')

    return {
      success: true,
      message,
      data: {
        invoice,
        transaction_count: transactions.length,
        remaining_cents: remaining,
      },
      actionType: 'invoice_result',
    }
  } catch {
    return {
      success: false,
      message:
        'Não consegui consultar a fatura. Verifique se o cartão tem dia de fechamento configurado.',
      actionType: 'error',
    }
  }
}

async function executeLimitUsage(
  creditCardName: string | undefined,
  ctx: ToolContext
): Promise<ActionResult> {
  if (!creditCardName) {
    return {
      success: false,
      message: 'Qual cartão de crédito você quer consultar o limite?',
      actionType: 'error',
    }
  }

  const creditCard = await findCreditCardByName(ctx.supabase, ctx.userId, creditCardName)

  if (!creditCard) {
    return {
      success: false,
      message: `Não encontrei o cartão "${creditCardName}". Verifique o nome e tente novamente.`,
      actionType: 'error',
    }
  }

  try {
    const usage = await ctx.getCreditCardLimitUsageUseCase.execute(ctx.userId, creditCard.id)

    const message = [
      `Limite do ${creditCard.name}:`,
      `Limite total: ${formatCurrency(usage.credit_limit_cents)}`,
      `Utilizado: ${formatCurrency(usage.used_cents)}`,
      `Disponível: ${formatCurrency(usage.available_cents)}`,
    ].join('\n')

    return {
      success: true,
      message,
      data: usage,
      actionType: 'invoice_result',
    }
  } catch {
    return {
      success: false,
      message: 'Não consegui consultar o limite. Verifique se o cartão tem limite configurado.',
      actionType: 'error',
    }
  }
}

async function executeOpenInvoices(
  creditCardName: string | undefined,
  ctx: ToolContext
): Promise<ActionResult> {
  let cards: CreditCard[]

  if (creditCardName) {
    const creditCard = await findCreditCardByName(ctx.supabase, ctx.userId, creditCardName)

    if (!creditCard) {
      return {
        success: false,
        message: `Não encontrei o cartão "${creditCardName}". Verifique o nome e tente novamente.`,
        actionType: 'error',
      }
    }

    cards = [creditCard]
  } else {
    cards = await ctx.creditCardsRepository.findByUserId(ctx.userId)
  }

  if (cards.length === 0) {
    return {
      success: true,
      message: 'Você não tem cartões de crédito cadastrados.',
      data: { invoices: [] },
      actionType: 'invoice_result',
    }
  }

  const allOpenInvoices: Array<{
    card_name: string
    reference_month: string
    total_cents: number
    remaining_cents: number
    status: string
  }> = []

  for (const card of cards) {
    const unpaid = await ctx.invoicesRepository.findUnpaidByCard(card.id, ctx.userId)

    for (const invoice of unpaid) {
      const remaining =
        invoice.total_amount_cents + invoice.carry_over_cents - invoice.paid_amount_cents
      allOpenInvoices.push({
        card_name: card.name,
        reference_month: invoice.reference_month,
        total_cents: invoice.total_amount_cents,
        remaining_cents: remaining,
        status: invoice.status,
      })
    }
  }

  if (allOpenInvoices.length === 0) {
    return {
      success: true,
      message: 'Você não tem faturas em aberto.',
      data: { invoices: [] },
      actionType: 'invoice_result',
    }
  }

  const totalRemaining = allOpenInvoices.reduce((sum, inv) => sum + inv.remaining_cents, 0)

  const lines = allOpenInvoices.map(
    (inv) => `${inv.card_name} - ${inv.reference_month}: ${formatCurrency(inv.remaining_cents)}`
  )

  const message = [
    `Faturas em aberto (${allOpenInvoices.length}):`,
    ...lines,
    `Total pendente: ${formatCurrency(totalRemaining)}`,
  ].join('\n')

  return {
    success: true,
    message,
    data: { invoices: allOpenInvoices, total_remaining_cents: totalRemaining },
    actionType: 'invoice_result',
  }
}
