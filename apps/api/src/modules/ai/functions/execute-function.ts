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

  const expenses = await context.expensesRepository.findByUserId(context.userId, {
    start_date: params.start_date,
    end_date: params.end_date,
    category_id: categoryId,
    payment_method: params.payment_method,
  })

  const total = expenses.reduce((sum, e) => sum + e.amount_cents, 0)
  const formattedTotal = formatCurrency(total)

  let message: string
  if (params.category_name) {
    message = `Seus gastos com ${params.category_name}: ${formattedTotal} (${expenses.length} despesas)`
  } else if (params.start_date && params.end_date) {
    message = `Total de gastos no período: ${formattedTotal} (${expenses.length} despesas)`
  } else {
    message = `Total de gastos: ${formattedTotal} (${expenses.length} despesas)`
  }

  let groupedData: Record<string, { total: number; count: number }> | undefined
  if (params.group_by && expenses.length > 0) {
    groupedData = groupExpenses(expenses, params.group_by, context.supabase, context.userId)
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
    breakdown: { recurrent: number; installments: number }
  }> = []

  for (let i = 1; i <= monthsAhead; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthStr = targetDate.toISOString().slice(0, 7)

    let recurrentTotal = 0
    let installmentsTotal = 0

    if (params.include_recurrent !== false) {
      const recurrentExpenses = await context.expensesRepository.findByUserId(context.userId, {})
      const recurrent = recurrentExpenses.filter((e) => e.is_recurrent)
      recurrentTotal = recurrent.reduce((sum, e) => sum + e.amount_cents, 0)
    }

    if (params.include_installments !== false) {
      const startDate = `${monthStr}-01`
      const endDate = `${monthStr}-31`
      const expenses = await context.expensesRepository.findByUserId(context.userId, {
        start_date: startDate,
        end_date: endDate,
      })
      const installments = expenses.filter((e) => e.installment_total && e.installment_total > 1)
      installmentsTotal = installments.reduce((sum, e) => sum + e.amount_cents, 0)
    }

    forecasts.push({
      month: monthStr,
      total: recurrentTotal + installmentsTotal,
      breakdown: {
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
  const lastMonth = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1)
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
