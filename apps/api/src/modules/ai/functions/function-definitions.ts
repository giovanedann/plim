import type { FunctionDefinition, JsonSchema } from '../client'

const createExpenseParameters: JsonSchema = {
  type: 'object',
  description: 'Create a new expense record',
  properties: {
    description: {
      type: 'string',
      description: 'What was purchased',
    },
    amount_cents: {
      type: 'integer',
      description: 'Value in cents (R$29.90 = 2990)',
    },
    category_name: {
      type: 'string',
      description: 'Category name from available categories',
    },
    payment_method: {
      type: 'string',
      description: 'How it was paid',
      enum: ['credit_card', 'debit_card', 'pix', 'cash'],
    },
    date: {
      type: 'string',
      description: 'Transaction date (YYYY-MM-DD)',
    },
    credit_card_name: {
      type: 'string',
      description: 'Card name when payment_method is credit_card',
    },
    installment_total: {
      type: 'integer',
      description: 'Number of installments (2-48)',
    },
    is_recurrent: {
      type: 'boolean',
      description: 'Monthly recurring expense',
    },
    recurrence_day: {
      type: 'integer',
      description: 'Day of month for recurrents (1-31)',
    },
  },
  required: ['description', 'amount_cents', 'category_name', 'payment_method', 'date'],
}

const queryExpensesParameters: JsonSchema = {
  type: 'object',
  description: 'Query expenses with filters and simple totals',
  properties: {
    start_date: {
      type: 'string',
      description: 'Start date (YYYY-MM-DD)',
    },
    end_date: {
      type: 'string',
      description: 'End date (YYYY-MM-DD)',
    },
    category_name: {
      type: 'string',
      description: 'Filter by category',
    },
    payment_method: {
      type: 'string',
      description: 'Filter by payment method',
      enum: ['credit_card', 'debit_card', 'pix', 'cash'],
    },
    credit_card_name: {
      type: 'string',
      description: 'Filter by credit card',
    },
    group_by: {
      type: 'string',
      description: 'Group results',
      enum: ['category', 'payment_method', 'day', 'month'],
    },
  },
}

const forecastSpendingParameters: JsonSchema = {
  type: 'object',
  description: 'Project future spending',
  properties: {
    months_ahead: {
      type: 'integer',
      description: 'Months to forecast (1-12)',
    },
    include_recurrent: {
      type: 'boolean',
      description: 'Include recurrent expenses',
    },
    include_installments: {
      type: 'boolean',
      description: 'Include future installments',
    },
  },
}

const executeQueryParameters: JsonSchema = {
  type: 'object',
  description: 'Execute SQL for complex queries (GROUP BY, aggregations, JOINs)',
  properties: {
    sql: {
      type: 'string',
      description: 'PostgreSQL SELECT query with {userId} placeholder',
    },
    description: {
      type: 'string',
      description: 'Brief label for this query',
    },
  },
  required: ['sql', 'description'],
}

const showTutorialParameters: JsonSchema = {
  type: 'object',
  description:
    'Show an interactive tutorial that guides the user through UI steps. Use when user asks HOW to do something (e.g., "como adiciono uma despesa?", "onde fica o dashboard?")',
  properties: {
    tutorial_id: {
      type: 'string',
      description: 'Tutorial identifier',
      enum: ['add-expense', 'manage-categories', 'setup-credit-card', 'view-dashboard'],
    },
  },
  required: ['tutorial_id'],
}

export const aiFunctionDefinitions: FunctionDefinition[] = [
  {
    name: 'create_expense',
    description: 'Create expense record',
    parameters: createExpenseParameters,
  },
  {
    name: 'query_expenses',
    description: 'Query expenses with filters (auto-projects recurrents)',
    parameters: queryExpensesParameters,
  },
  {
    name: 'forecast_spending',
    description: 'Project future spending',
    parameters: forecastSpendingParameters,
  },
  {
    name: 'execute_query',
    description: 'SQL for GROUP BY, aggregations, JOINs',
    parameters: executeQueryParameters,
  },
  {
    name: 'show_tutorial',
    description:
      'Show interactive UI tutorial when user asks HOW to do something (not when requesting an action)',
    parameters: showTutorialParameters,
  },
]

export {
  createExpenseParameters,
  queryExpensesParameters,
  forecastSpendingParameters,
  executeQueryParameters,
  showTutorialParameters,
}
