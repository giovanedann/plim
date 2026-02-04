import type { FunctionDefinition, JsonSchema } from '../client'

/**
 * JSON Schema for create_expense function parameters
 */
const createExpenseParameters: JsonSchema = {
  type: 'object',
  description: 'Parameters for creating a new expense',
  properties: {
    description: {
      type: 'string',
      description:
        'Description of the expense (e.g., "Almoço no restaurante", "Uber para o trabalho")',
    },
    amount_cents: {
      type: 'integer',
      description: 'Amount in centavos (e.g., 2990 for R$29.90)',
    },
    category_name: {
      type: 'string',
      description:
        'Category name in Portuguese (e.g., "Alimentação", "Transporte", "Lazer", "Saúde", "Educação", "Moradia")',
    },
    payment_method: {
      type: 'string',
      description: 'Payment method used',
      enum: ['credit_card', 'debit_card', 'pix', 'cash'],
    },
    date: {
      type: 'string',
      description: 'Date of the expense in YYYY-MM-DD format',
    },
    credit_card_name: {
      type: 'string',
      description:
        'Name of the credit card if payment_method is credit_card (e.g., "Nubank", "Itaú")',
    },
    installment_total: {
      type: 'integer',
      description: 'Number of installments if this is a parcelado purchase (2-48)',
    },
    is_recurrent: {
      type: 'boolean',
      description: 'Whether this expense repeats every month',
    },
    recurrence_day: {
      type: 'integer',
      description: 'Day of month for recurrent expenses (1-31)',
    },
  },
  required: ['description', 'amount_cents', 'category_name', 'payment_method', 'date'],
}

/**
 * JSON Schema for query_expenses function parameters
 */
const queryExpensesParameters: JsonSchema = {
  type: 'object',
  description: 'Parameters for querying expenses',
  properties: {
    start_date: {
      type: 'string',
      description: 'Start date for the query in YYYY-MM-DD format',
    },
    end_date: {
      type: 'string',
      description: 'End date for the query in YYYY-MM-DD format',
    },
    category_name: {
      type: 'string',
      description: 'Filter by category name (e.g., "Alimentação", "Pets", "Transporte")',
    },
    payment_method: {
      type: 'string',
      description: 'Filter by payment method',
      enum: ['credit_card', 'debit_card', 'pix', 'cash'],
    },
    credit_card_name: {
      type: 'string',
      description: 'Filter by credit card name (e.g., "Nubank", "Nubank Ultravioleta", "Itaú")',
    },
    group_by: {
      type: 'string',
      description: 'How to group the results',
      enum: ['category', 'payment_method', 'day', 'month'],
    },
  },
}

/**
 * JSON Schema for forecast_spending function parameters
 */
const forecastSpendingParameters: JsonSchema = {
  type: 'object',
  description: 'Parameters for forecasting future spending',
  properties: {
    months_ahead: {
      type: 'integer',
      description: 'Number of months to forecast (1-12, default 3)',
    },
    include_recurrent: {
      type: 'boolean',
      description: 'Include recurrent expenses in forecast (default true)',
    },
    include_installments: {
      type: 'boolean',
      description: 'Include future installments in forecast (default true)',
    },
  },
}

/**
 * Function definitions for AI function calling
 */
export const aiFunctionDefinitions: FunctionDefinition[] = [
  {
    name: 'create_expense',
    description: `Create a new expense entry. Use this when the user mentions a purchase, payment, or spending.
Examples:
- "Comprei um tênis de R$299" → create expense
- "Paguei R$50 de Uber" → create expense
- "Almocei no restaurante por R$35" → create expense
- "Assinatura da Netflix de R$55.90 todo mês" → create recurrent expense
- "Comprei um celular de R$2000 em 12x no Nubank" → create installment expense`,
    parameters: createExpenseParameters,
  },
  {
    name: 'query_expenses',
    description: `Query and summarize expenses. Use this when the user asks about their spending history or wants to know totals.
Examples:
- "Quanto gastei em janeiro?" → query with date range (first day to last day of January)
- "Quanto gastei esse mês?" → query current month with start_date: first day of current month, end_date: LAST day of current month (NOT today)
- "Quanto gastei com alimentação?" → query by category_name
- "Quanto gastei com meus pets?" → query by category_name (user's custom category)
- "Quais foram meus gastos no cartão de crédito?" → query by payment_method: credit_card
- "Quanto gastei no pix?" → query by payment_method: pix
- "Quanto gastei no cartão Nubank?" → query by credit_card_name
- "Quanto gastei no Nubank Ultravioleta esse mês?" → query by credit_card_name with date range
- "Me mostra um resumo do mês" → query current month grouped by category

IMPORTANT: For monthly queries ("esse mês", "mês passado"), always use the FULL month (first day to last day), NOT just up to today's date.`,
    parameters: queryExpensesParameters,
  },
  {
    name: 'forecast_spending',
    description: `Forecast future spending based on recurrent expenses and installments. Use this when the user asks about future costs.
Examples:
- "Quanto vou gastar até março?" → forecast next months
- "Quais são minhas despesas fixas?" → forecast with recurrent only
- "Quanto ainda tenho de parcelas?" → forecast with installments only`,
    parameters: forecastSpendingParameters,
  },
]

export { createExpenseParameters, queryExpensesParameters, forecastSpendingParameters }
