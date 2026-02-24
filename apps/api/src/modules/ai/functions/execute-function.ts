import {
  type Category,
  type CreateExpense,
  type CreditCard,
  type Expense,
  type UpdateCreditCard,
  createExpenseFunctionParamsSchema,
  forecastSpendingFunctionParamsSchema,
  payInvoiceFunctionParamsSchema,
  queryExpensesFunctionParamsSchema,
  queryInvoicesFunctionParamsSchema,
  updateCreditCardFunctionParamsSchema,
} from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreditCardsRepository } from '../../credit-cards/credit-cards.repository'
import type { UpdateCreditCardUseCase } from '../../credit-cards/update-credit-card.usecase'
import type { CreateExpenseUseCase } from '../../expenses/create-expense.usecase'
import type { ExpensesRepository } from '../../expenses/expenses.repository'
import type { GetCreditCardLimitUsageUseCase } from '../../invoices/get-credit-card-limit-usage.usecase'
import type { GetOrCreateInvoiceUseCase } from '../../invoices/get-or-create-invoice.usecase'
import type { InvoicesRepository } from '../../invoices/invoices.repository'
import type { PayInvoiceUseCase } from '../../invoices/pay-invoice.usecase'
import type { FunctionCall } from '../client'
import { executeQuery } from './execute-query'

export interface FunctionExecutionContext {
  userId: string
  supabase: SupabaseClient
  createExpenseUseCase: CreateExpenseUseCase
  expensesRepository: ExpensesRepository
  updateCreditCardUseCase: UpdateCreditCardUseCase
  getOrCreateInvoiceUseCase: GetOrCreateInvoiceUseCase
  getCreditCardLimitUsageUseCase: GetCreditCardLimitUsageUseCase
  payInvoiceUseCase: PayInvoiceUseCase
  invoicesRepository: InvoicesRepository
  creditCardsRepository: CreditCardsRepository
}

export interface FunctionExecutionResult {
  success: boolean
  message: string
  data?: unknown
  actionType:
    | 'expense_created'
    | 'query_result'
    | 'forecast_result'
    | 'show_tutorial'
    | 'credit_card_updated'
    | 'invoice_result'
    | 'invoice_paid'
    | 'error'
}

export async function executeFunction(
  functionCall: FunctionCall,
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  switch (functionCall.name) {
    case 'create_expense':
      return executeCreateExpense(functionCall.args, context)
    case 'query_expenses':
      return executeQueryExpenses(functionCall.args, context)
    case 'forecast_spending':
      return executeForecastSpending(functionCall.args, context)
    case 'execute_query':
      return executeQuery(functionCall.args, context.userId, context.supabase)
    case 'query_invoices':
      return executeQueryInvoices(functionCall.args, context)
    case 'update_credit_card':
      return executeUpdateCreditCard(functionCall.args, context)
    case 'pay_invoice':
      return executePayInvoice(functionCall.args, context)
    case 'show_tutorial':
      return executeShowTutorial(functionCall.args)
    default:
      return {
        success: false,
        message: `Função desconhecida: ${functionCall.name}`,
        actionType: 'error',
      }
  }
}

const VALID_TUTORIAL_IDS = [
  'add-expense',
  'manage-categories',
  'setup-credit-card',
  'view-dashboard',
  'profile-settings',
  'view-upgrade',
]

export const TUTORIAL_MESSAGES: Record<string, string> = {
  'add-expense': 'Vou te mostrar como adicionar uma despesa!',
  'manage-categories': 'Vou te mostrar como gerenciar suas categorias!',
  'setup-credit-card': 'Vou te mostrar como configurar um cartão de crédito!',
  'view-dashboard': 'Vou te mostrar como usar o dashboard!',
  'profile-settings': 'Vou te mostrar como editar seu perfil!',
  'view-upgrade': 'Vou te mostrar como assinar o plano Pro!',
}

function executeShowTutorial(args: Record<string, unknown>): FunctionExecutionResult {
  const tutorialId = args.tutorial_id as string

  if (!tutorialId || !VALID_TUTORIAL_IDS.includes(tutorialId)) {
    return {
      success: false,
      message: 'Tutorial não encontrado.',
      actionType: 'error',
    }
  }

  return {
    success: true,
    message: TUTORIAL_MESSAGES[tutorialId] ?? 'Vou te mostrar como fazer isso!',
    data: { tutorial_id: tutorialId },
    actionType: 'show_tutorial',
  }
}

async function executeUpdateCreditCard(
  args: Record<string, unknown>,
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  const parseResult = updateCreditCardFunctionParamsSchema.safeParse(args)

  if (!parseResult.success) {
    return {
      success: false,
      message: 'Não consegui entender os dados para atualizar o cartão. Pode repetir?',
      actionType: 'error',
    }
  }

  const params = parseResult.data

  const creditCard = await findCreditCardByName(
    context.supabase,
    context.userId,
    params.credit_card_name
  )

  if (!creditCard) {
    return {
      success: false,
      message: `Não encontrei o cartão "${params.credit_card_name}". Verifique o nome e tente novamente.`,
      actionType: 'error',
    }
  }

  const updateInput: UpdateCreditCard = {}

  if (params.closing_day !== undefined) {
    updateInput.closing_day = params.closing_day
  }

  if (params.credit_limit_cents !== undefined) {
    updateInput.credit_limit_cents = params.credit_limit_cents
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
    const updated = await context.updateCreditCardUseCase.execute(
      context.userId,
      creditCard.id,
      updateInput
    )

    const details: string[] = []
    if (params.closing_day !== undefined) {
      details.push(`dia de fechamento para ${params.closing_day}`)
    }
    if (params.credit_limit_cents !== undefined) {
      details.push(`limite para ${formatCurrency(params.credit_limit_cents)}`)
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
}

async function executePayInvoice(
  args: Record<string, unknown>,
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  const parseResult = payInvoiceFunctionParamsSchema.safeParse(args)

  if (!parseResult.success) {
    return {
      success: false,
      message: 'Não consegui entender os dados do pagamento. Pode repetir?',
      actionType: 'error',
    }
  }

  const params = parseResult.data

  let creditCardId: string | undefined
  let cardName: string | undefined

  if (params.credit_card_name) {
    const creditCard = await findCreditCardByName(
      context.supabase,
      context.userId,
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
    const activeCards = await context.creditCardsRepository.findByUserId(context.userId)
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
    const { invoice } = await context.getOrCreateInvoiceUseCase.execute(
      context.userId,
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

    const updatedInvoice = await context.payInvoiceUseCase.execute(
      context.userId,
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
}

async function executeQueryInvoices(
  args: Record<string, unknown>,
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  const parseResult = queryInvoicesFunctionParamsSchema.safeParse(args)

  if (!parseResult.success) {
    return {
      success: false,
      message: 'Não consegui entender sua pergunta sobre faturas. Pode reformular?',
      actionType: 'error',
    }
  }

  const params = parseResult.data

  switch (params.query_type) {
    case 'invoice_details':
      return executeInvoiceDetails(params.credit_card_name, params.reference_month, context)
    case 'limit_usage':
      return executeLimitUsage(params.credit_card_name, context)
    case 'open_invoices':
      return executeOpenInvoices(params.credit_card_name, context)
    default:
      return {
        success: false,
        message: 'Tipo de consulta de fatura não reconhecido.',
        actionType: 'error',
      }
  }
}

async function executeInvoiceDetails(
  creditCardName: string | undefined,
  referenceMonth: string | undefined,
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  if (!creditCardName) {
    return {
      success: false,
      message: 'Qual cartão de crédito você quer consultar a fatura?',
      actionType: 'error',
    }
  }

  const creditCard = await findCreditCardByName(context.supabase, context.userId, creditCardName)

  if (!creditCard) {
    return {
      success: false,
      message: `Não encontrei o cartão "${creditCardName}". Verifique o nome e tente novamente.`,
      actionType: 'error',
    }
  }

  const month = referenceMonth ?? new Date().toISOString().slice(0, 7)

  try {
    const result = await context.getOrCreateInvoiceUseCase.execute(
      context.userId,
      creditCard.id,
      month
    )

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
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  if (!creditCardName) {
    return {
      success: false,
      message: 'Qual cartão de crédito você quer consultar o limite?',
      actionType: 'error',
    }
  }

  const creditCard = await findCreditCardByName(context.supabase, context.userId, creditCardName)

  if (!creditCard) {
    return {
      success: false,
      message: `Não encontrei o cartão "${creditCardName}". Verifique o nome e tente novamente.`,
      actionType: 'error',
    }
  }

  try {
    const usage = await context.getCreditCardLimitUsageUseCase.execute(
      context.userId,
      creditCard.id
    )

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
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  let cards: CreditCard[]

  if (creditCardName) {
    const creditCard = await findCreditCardByName(context.supabase, context.userId, creditCardName)

    if (!creditCard) {
      return {
        success: false,
        message: `Não encontrei o cartão "${creditCardName}". Verifique o nome e tente novamente.`,
        actionType: 'error',
      }
    }

    cards = [creditCard]
  } else {
    cards = await context.creditCardsRepository.findByUserId(context.userId)
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
    const unpaid = await context.invoicesRepository.findUnpaidByCard(card.id, context.userId)

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

async function executeCreateExpense(
  args: Record<string, unknown>,
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  const parseResult = createExpenseFunctionParamsSchema.safeParse(args)

  if (!parseResult.success) {
    return {
      success: false,
      message: 'Não consegui entender os dados da despesa. Pode repetir?',
      actionType: 'error',
    }
  }

  const params = parseResult.data
  const isIncome = params.transaction_type === 'income'

  let categoryId: string | undefined
  if (params.category_name) {
    const category = await findCategoryByName(
      context.supabase,
      context.userId,
      params.category_name
    )
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
      context.supabase,
      context.userId,
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
    const result = await context.createExpenseUseCase.execute(context.userId, createExpenseInput)
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
}

async function executeQueryExpenses(
  args: Record<string, unknown>,
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  const parseResult = queryExpensesFunctionParamsSchema.safeParse(args)

  if (!parseResult.success) {
    return {
      success: false,
      message: 'Não consegui entender sua pergunta. Pode reformular?',
      actionType: 'error',
    }
  }

  const params = parseResult.data

  let categoryId: string | undefined
  if (params.category_name) {
    const category = await findCategoryByName(
      context.supabase,
      context.userId,
      params.category_name
    )
    if (category) {
      categoryId = category.id
    }
  }

  let creditCardId: string | undefined
  if (params.credit_card_name) {
    const creditCard = await findCreditCardByName(
      context.supabase,
      context.userId,
      params.credit_card_name
    )
    if (creditCard) {
      creditCardId = creditCard.id
    }
  }

  // Query all expenses (recurrents are now materialized)
  const expenses = await context.expensesRepository.findByUserId(context.userId, {
    start_date: params.start_date,
    end_date: params.end_date,
    category_id: categoryId,
    payment_method: params.payment_method,
    credit_card_id: creditCardId,
  })

  const total = expenses.reduce((sum, e) => sum + e.amount_cents, 0)
  const formattedTotal = formatCurrency(total)

  // Build base message
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
}

async function executeForecastSpending(
  args: Record<string, unknown>,
  context: FunctionExecutionContext
): Promise<FunctionExecutionResult> {
  const parseResult = forecastSpendingFunctionParamsSchema.safeParse(args)

  if (!parseResult.success) {
    return {
      success: false,
      message: 'Não consegui entender sua pergunta sobre previsão. Pode reformular?',
      actionType: 'error',
    }
  }

  const params = parseResult.data
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

    // Query all expenses for this month (recurrents are now materialized)
    const expenses = await context.expensesRepository.findByUserId(context.userId, {
      start_date: startDate,
      end_date: endDate,
    })

    // Categorize expenses
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

  const monthNames = [
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
  const lastMonth = new Date(now.getFullYear(), now.getMonth() + monthsAhead - 1, 1)
  const lastMonthName = monthNames[lastMonth.getMonth()]

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
}

async function findCategoryByName(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<Category | null> {
  const { data, error } = await supabase
    .from('category')
    .select('id, user_id, name, icon, color, is_active, created_at, updated_at')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('is_active', true)
    .ilike('name', name)
    .limit(1)
    .single()

  if (error || !data) return null

  return data as Category
}

async function findCreditCardByName(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<CreditCard | null> {
  const { data, error } = await supabase
    .from('credit_card')
    .select(
      'id, user_id, name, color, flag, bank, last_4_digits, is_active, created_at, updated_at'
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .ilike('name', `%${name}%`)
    .limit(1)
    .single()

  if (error || !data) return null

  return data as CreditCard
}

function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountCents / 100)
}

function groupExpenses(
  expenses: Expense[],
  groupBy: string
): Record<string, { total: number; count: number }> {
  const groups: Record<string, { total: number; count: number }> = {}

  for (const expense of expenses) {
    let key: string

    switch (groupBy) {
      case 'category':
        key = expense.category_id ?? 'uncategorized'
        break
      case 'payment_method':
        key = expense.payment_method
        break
      case 'day':
        key = expense.date
        break
      case 'month':
        key = expense.date.slice(0, 7)
        break
      default:
        key = 'other'
    }

    const existing = groups[key]
    if (existing) {
      existing.total += expense.amount_cents
      existing.count += 1
    } else {
      groups[key] = { total: expense.amount_cents, count: 1 }
    }
  }

  return groups
}
