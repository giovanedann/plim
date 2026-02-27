import type { ToolSet } from 'ai'
import { createCreateExpenseTool } from './create-expense.tool'
import { createExecuteQueryTool } from './execute-query.tool'
import { createForecastSpendingTool } from './forecast-spending.tool'
import { createPayInvoiceTool } from './pay-invoice.tool'
import { createQueryExpensesTool } from './query-expenses.tool'
import { createQueryInvoicesTool } from './query-invoices.tool'
import { createShowTutorialTool } from './show-tutorial.tool'
import type { ToolContext } from './types'
import { createUpdateCreditCardTool } from './update-credit-card.tool'
import { createUpdateSalaryTool } from './update-salary.tool'

export type { ActionResult, ToolContext } from './types'

export function createTools(ctx: ToolContext): ToolSet {
  return {
    show_tutorial: createShowTutorialTool(),
    execute_query: createExecuteQueryTool(ctx),
    query_expenses: createQueryExpensesTool(ctx),
    create_expense: createCreateExpenseTool(ctx),
    forecast_spending: createForecastSpendingTool(ctx),
    update_credit_card: createUpdateCreditCardTool(ctx),
    update_salary: createUpdateSalaryTool(ctx),
    pay_invoice: createPayInvoiceTool(ctx),
    query_invoices: createQueryInvoicesTool(ctx),
  }
}
