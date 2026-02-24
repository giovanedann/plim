import type { FunctionDefinition, JsonSchema } from '../client'

const createExpenseParameters: JsonSchema = {
  type: 'object',
  description:
    'Create a new expense or income record. For incomes, set transaction_type to "income".',
  properties: {
    description: {
      type: 'string',
      description: 'What was purchased or received',
    },
    amount_cents: {
      type: 'integer',
      description: 'Value in cents (R$29.90 = 2990)',
    },
    category_name: {
      type: 'string',
      description: 'Category name from available categories (optional for incomes)',
    },
    payment_method: {
      type: 'string',
      description: 'How it was paid or received',
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
      description: 'Number of installments (2-48, only for expenses)',
    },
    is_recurrent: {
      type: 'boolean',
      description: 'Monthly recurring expense',
    },
    recurrence_day: {
      type: 'integer',
      description: 'Day of month for recurrents (1-31)',
    },
    transaction_type: {
      type: 'string',
      description: 'Type of transaction: "expense" (default) or "income"',
      enum: ['expense', 'income'],
    },
  },
  required: ['description', 'amount_cents', 'payment_method', 'date'],
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

const queryInvoicesParameters: JsonSchema = {
  type: 'object',
  description: 'Query credit card invoices, check available credit limit, or list open invoices',
  properties: {
    credit_card_name: {
      type: 'string',
      description: 'Name of the credit card to query',
    },
    reference_month: {
      type: 'string',
      description: 'Invoice reference month (YYYY-MM)',
    },
    query_type: {
      type: 'string',
      description: 'Type of invoice query',
      enum: ['invoice_details', 'limit_usage', 'open_invoices'],
    },
  },
  required: ['query_type'],
}

const updateCreditCardParameters: JsonSchema = {
  type: 'object',
  description: 'Update credit card settings like closing day or credit limit',
  properties: {
    credit_card_name: {
      type: 'string',
      description: 'Name of the credit card to update',
    },
    closing_day: {
      type: 'integer',
      description: 'Invoice closing day of the month (1-31)',
    },
    credit_limit_cents: {
      type: 'integer',
      description: 'Credit limit in cents (R$5000 = 500000)',
    },
  },
  required: ['credit_card_name'],
}

const payInvoiceParameters: JsonSchema = {
  type: 'object',
  description:
    'Pay a credit card invoice (full or partial). Use when user says they paid an invoice.',
  properties: {
    credit_card_name: {
      type: 'string',
      description: 'Name of the credit card (optional if user has only one card)',
    },
    reference_month: {
      type: 'string',
      description: 'Invoice reference month (YYYY-MM)',
    },
    amount_cents: {
      type: 'integer',
      description: 'Payment amount in cents (R$2000 = 200000). Omit for full payment.',
    },
    pay_full: {
      type: 'boolean',
      description:
        'True when user wants to pay the full invoice (e.g., "integralmente", "total", "toda")',
    },
  },
  required: ['reference_month'],
}

const showTutorialParameters: JsonSchema = {
  type: 'object',
  description:
    'Show an interactive tutorial that guides the user through UI steps. Use when user asks HOW to do something (e.g., "como adiciono uma despesa?", "onde fica o dashboard?")',
  properties: {
    tutorial_id: {
      type: 'string',
      description: 'Tutorial identifier',
      enum: [
        'add-expense',
        'manage-categories',
        'setup-credit-card',
        'view-dashboard',
        'profile-settings',
        'view-upgrade',
      ],
    },
  },
  required: ['tutorial_id'],
}

export const aiFunctionDefinitions: FunctionDefinition[] = [
  {
    name: 'create_expense',
    description: 'Create expense or income record (use transaction_type="income" for incomes)',
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
    name: 'query_invoices',
    description: 'Query invoice details, check available credit limit, or list open invoices',
    parameters: queryInvoicesParameters,
  },
  {
    name: 'update_credit_card',
    description: 'Update credit card settings (closing day, credit limit)',
    parameters: updateCreditCardParameters,
  },
  {
    name: 'pay_invoice',
    description: 'Pay a credit card invoice (full or partial)',
    parameters: payInvoiceParameters,
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
  queryInvoicesParameters,
  updateCreditCardParameters,
  payInvoiceParameters,
  showTutorialParameters,
}
