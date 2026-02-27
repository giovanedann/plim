import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreditCardsRepository } from '../../credit-cards/credit-cards.repository'
import type { UpdateCreditCardUseCase } from '../../credit-cards/update-credit-card.usecase'
import type { CreateExpenseUseCase } from '../../expenses/create-expense.usecase'
import type { ExpensesRepository } from '../../expenses/expenses.repository'
import type { GetCreditCardLimitUsageUseCase } from '../../invoices/get-credit-card-limit-usage.usecase'
import type { GetOrCreateInvoiceUseCase } from '../../invoices/get-or-create-invoice.usecase'
import type { InvoicesRepository } from '../../invoices/invoices.repository'
import type { PayInvoiceUseCase } from '../../invoices/pay-invoice.usecase'
import type { CreateSalaryUseCase } from '../../salary/create-salary.usecase'

export interface ToolContext {
  userId: string
  supabase: SupabaseClient
  createExpenseUseCase: CreateExpenseUseCase
  createSalaryUseCase: CreateSalaryUseCase
  expensesRepository: ExpensesRepository
  updateCreditCardUseCase: UpdateCreditCardUseCase
  getOrCreateInvoiceUseCase: GetOrCreateInvoiceUseCase
  getCreditCardLimitUsageUseCase: GetCreditCardLimitUsageUseCase
  payInvoiceUseCase: PayInvoiceUseCase
  invoicesRepository: InvoicesRepository
  creditCardsRepository: CreditCardsRepository
}

export interface ActionResult {
  success: boolean
  message: string
  data?: unknown
  actionType:
    | 'expense_created'
    | 'query_result'
    | 'forecast_result'
    | 'show_tutorial'
    | 'credit_card_updated'
    | 'salary_updated'
    | 'invoice_result'
    | 'invoice_paid'
    | 'error'
}
