import {
  type Category,
  type CreateExpense,
  type CreditCard,
  type Expense,
  createExpenseFunctionParamsSchema,
  forecastSpendingFunctionParamsSchema,
  queryExpensesFunctionParamsSchema,
} from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateExpenseUseCase } from '../../expenses/create-expense.usecase'
import type { ExpensesRepository } from '../../expenses/expenses.repository'
import type { FunctionCall } from '../client'

export interface FunctionExecutionContext {
  userId: string
  supabase: SupabaseClient
  createExpenseUseCase: CreateExpenseUseCase
  expensesRepository: ExpensesRepository
}

export interface FunctionExecutionResult {
  success: boolean
  message: string
  data?: unknown
  actionType: 'expense_created' | 'query_result' | 'forecast_result' | 'error'
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
    default:
      return {
        success: false,
        message: `Função desconhecida: ${functionCall.name}`,
        actionType: 'error',
      }
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

  const category = await findCategoryByName(context.supabase, context.userId, params.category_name)
  if (!category) {
    return {
      success: false,
      message: `Não encontrei a categoria "${params.category_name}". Você pode criar ela primeiro ou escolher outra.`,
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

  if (params.installment_total && params.installment_total >= 2) {
    createExpenseInput = {
      type: 'installment',
      category_id: category.id,
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
      category_id: category.id,
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
      category_id: category.id,
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
    let message: string

    if (params.installment_total && params.installment_total >= 2) {
      const installmentAmount = formatCurrency(
        Math.ceil(params.amount_cents / params.installment_total)
      )
      message = `Despesa criada: ${params.description} de ${formattedAmount} em ${params.installment_total}x de ${installmentAmount}`
    } else if (params.is_recurrent) {
      message = `Despesa recorrente criada: ${params.description} de ${formattedAmount} todo dia ${params.recurrence_day}`
    } else {
      message = `Despesa criada: ${params.description} de ${formattedAmount}`
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
      message: 'Não consegui criar a despesa. Tente novamente.',
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

  // Query non-recurrent expenses (one-time and installments) for the date range
  const nonRecurrentExpenses = await context.expensesRepository.findByUserId(context.userId, {
    start_date: params.start_date,
    end_date: params.end_date,
    category_id: categoryId,
    payment_method: params.payment_method,
    credit_card_id: creditCardId,
    expense_type: 'one_time',
  })

  // Query installment expenses separately
  const installmentExpenses = await context.expensesRepository.findByUserId(context.userId, {
    start_date: params.start_date,
    end_date: params.end_date,
    category_id: categoryId,
    payment_method: params.payment_method,
    credit_card_id: creditCardId,
    expense_type: 'installment',
  })

  // Combine non-recurrent expenses
  const actualExpenses = [...nonRecurrentExpenses, ...installmentExpenses]

  // Project recurrent expenses for the queried period if we have a date range
  let projectedRecurrentTotal = 0
  let projectedRecurrentCount = 0

  if (params.start_date && params.end_date) {
    const recurrentTemplates = await getRecurrentExpenseTemplatesFiltered(
      context,
      categoryId,
      params.payment_method,
      creditCardId
    )

    // Calculate all months in the date range
    const startDate = new Date(params.start_date)
    const endDate = new Date(params.end_date)

    const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

    while (currentMonth <= lastMonth) {
      const monthStr = currentMonth.toISOString().slice(0, 7)
      const { total, count } = projectRecurrentExpensesForMonthDetailed(
        recurrentTemplates,
        monthStr,
        params.start_date,
        params.end_date
      )
      projectedRecurrentTotal += total
      projectedRecurrentCount += count
      currentMonth.setMonth(currentMonth.getMonth() + 1)
    }
  }

  const totalExpenseCount = actualExpenses.length + projectedRecurrentCount
  const actualTotal = actualExpenses.reduce((sum, e) => sum + e.amount_cents, 0)
  const total = actualTotal + projectedRecurrentTotal
  const formattedTotal = formatCurrency(total)
  const formattedActualTotal = formatCurrency(actualTotal)
  const formattedRecurrentTotal = formatCurrency(projectedRecurrentTotal)

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

  // Format message with breakdown if there are projected recurrent expenses
  let message: string
  if (projectedRecurrentCount > 0) {
    message = `${baseMessage}: ${formattedTotal} (${totalExpenseCount} despesas) — sendo ${formattedActualTotal} já realizados (${actualExpenses.length}) e ${formattedRecurrentTotal} de recorrentes previstas (${projectedRecurrentCount})`
  } else {
    message = `${baseMessage}: ${formattedTotal} (${totalExpenseCount} despesas)`
  }

  let groupedData: Record<string, { total: number; count: number }> | undefined
  if (params.group_by && actualExpenses.length > 0) {
    groupedData = groupExpenses(actualExpenses, params.group_by, context.supabase, context.userId)
  }

  return {
    success: true,
    message,
    data: {
      total,
      count: totalExpenseCount,
      expenses: actualExpenses.slice(0, 10),
      grouped: groupedData,
      recurrent: {
        total: projectedRecurrentTotal,
        count: projectedRecurrentCount,
      },
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

  // Fetch recurrent expenses once (templates)
  const recurrentTemplates =
    params.include_recurrent !== false ? await getRecurrentExpenseTemplates(context) : []

  // Loop starts at 0 to include current month
  for (let i = 0; i < monthsAhead; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthStr = targetDate.toISOString().slice(0, 7)
    const startDate = `${monthStr}-01`
    const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate()
    const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`

    let oneTimeTotal = 0
    let recurrentTotal = 0
    let installmentsTotal = 0

    // Get all non-recurrent expenses for this month (one-time + installments)
    const expenses = await context.expensesRepository.findByUserId(context.userId, {
      start_date: startDate,
      end_date: endDate,
    })

    // Sum one-time expenses (non-recurrent, no installments)
    const oneTimeExpenses = expenses.filter(
      (e) => !e.is_recurrent && (!e.installment_total || e.installment_total <= 1)
    )
    oneTimeTotal = oneTimeExpenses.reduce((sum, e) => sum + e.amount_cents, 0)

    // Sum installment expenses
    if (params.include_installments !== false) {
      const installments = expenses.filter((e) => e.installment_total && e.installment_total > 1)
      installmentsTotal = installments.reduce((sum, e) => sum + e.amount_cents, 0)
    }

    // Project recurrent expenses for this month
    if (params.include_recurrent !== false) {
      recurrentTotal = projectRecurrentExpensesForMonth(recurrentTemplates, monthStr)
    }

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
  // Use monthsAhead - 1 since we now start from current month (i=0)
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

interface RecurrentTemplate {
  amount_cents: number
  recurrence_day: number
  recurrence_start: string
  recurrence_end: string | null
  category_id?: string
  payment_method?: string
  credit_card_id?: string | null
}

async function getRecurrentExpenseTemplates(
  context: FunctionExecutionContext
): Promise<RecurrentTemplate[]> {
  const { data, error } = await context.supabase
    .from('expense')
    .select('amount_cents, recurrence_day, recurrence_start, recurrence_end')
    .eq('user_id', context.userId)
    .eq('is_recurrent', true)

  if (error || !data) return []

  return data as RecurrentTemplate[]
}

async function getRecurrentExpenseTemplatesFiltered(
  context: FunctionExecutionContext,
  categoryId?: string,
  paymentMethod?: string,
  creditCardId?: string
): Promise<RecurrentTemplate[]> {
  let query = context.supabase
    .from('expense')
    .select(
      'amount_cents, recurrence_day, recurrence_start, recurrence_end, category_id, payment_method, credit_card_id'
    )
    .eq('user_id', context.userId)
    .eq('is_recurrent', true)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (paymentMethod) {
    query = query.eq('payment_method', paymentMethod)
  }

  if (creditCardId) {
    query = query.eq('credit_card_id', creditCardId)
  }

  const { data, error } = await query

  if (error || !data) return []

  return data as RecurrentTemplate[]
}

function projectRecurrentExpensesForMonth(
  templates: RecurrentTemplate[],
  monthStr: string
): number {
  let total = 0
  const year = Number.parseInt(monthStr.slice(0, 4), 10)
  const month = Number.parseInt(monthStr.slice(5, 7), 10) - 1 // 0-indexed

  for (const template of templates) {
    const recurrenceStart = new Date(template.recurrence_start)
    const recurrenceEnd = template.recurrence_end ? new Date(template.recurrence_end) : null

    // Create date for this recurrence in the target month
    const occurrenceDate = new Date(year, month, template.recurrence_day)

    // Check if this occurrence is within the recurrence bounds
    if (occurrenceDate >= recurrenceStart && (!recurrenceEnd || occurrenceDate <= recurrenceEnd)) {
      total += template.amount_cents
    }
  }

  return total
}

function projectRecurrentExpensesForMonthDetailed(
  templates: RecurrentTemplate[],
  monthStr: string,
  startDate: string,
  endDate: string
): { total: number; count: number } {
  let total = 0
  let count = 0
  const year = Number.parseInt(monthStr.slice(0, 4), 10)
  const month = Number.parseInt(monthStr.slice(5, 7), 10) - 1 // 0-indexed
  const queryStart = new Date(startDate)
  const queryEnd = new Date(endDate)

  for (const template of templates) {
    const recurrenceStart = new Date(template.recurrence_start)
    const recurrenceEnd = template.recurrence_end ? new Date(template.recurrence_end) : null

    // Create date for this recurrence in the target month
    const occurrenceDate = new Date(year, month, template.recurrence_day)

    // Check if this occurrence is within the recurrence bounds AND query date range
    if (
      occurrenceDate >= recurrenceStart &&
      (!recurrenceEnd || occurrenceDate <= recurrenceEnd) &&
      occurrenceDate >= queryStart &&
      occurrenceDate <= queryEnd
    ) {
      total += template.amount_cents
      count += 1
    }
  }

  return { total, count }
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
  groupBy: string,
  _supabase: SupabaseClient,
  _userId: string
): Record<string, { total: number; count: number }> {
  const groups: Record<string, { total: number; count: number }> = {}

  for (const expense of expenses) {
    let key: string

    switch (groupBy) {
      case 'category':
        key = expense.category_id
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
