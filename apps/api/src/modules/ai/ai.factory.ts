import type { SupabaseClient } from '@supabase/supabase-js'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { createServerPostHog } from '../../lib/posthog'
import { CreditCardsRepository } from '../credit-cards/credit-cards.repository'
import { UpdateCreditCardUseCase } from '../credit-cards/update-credit-card.usecase'
import { CreateExpenseUseCase } from '../expenses/create-expense.usecase'
import { ExpensesRepository } from '../expenses/expenses.repository'
import { GetCreditCardLimitUsageUseCase } from '../invoices/get-credit-card-limit-usage.usecase'
import { GetOrCreateInvoiceUseCase } from '../invoices/get-or-create-invoice.usecase'
import { InvoicesRepository } from '../invoices/invoices.repository'
import { PayInvoiceUseCase } from '../invoices/pay-invoice.usecase'
import { CreateSalaryUseCase } from '../salary/create-salary.usecase'
import { SalaryRepository } from '../salary/salary.repository'
import { AIRepository } from './ai.repository'
import { ChatUseCase } from './chat.usecase'
import { CheckUsageLimitUseCase } from './check-usage-limit.usecase'
import { GetUsageInfoUseCase } from './get-usage-info.usecase'

export interface AIDependencies {
  repository: AIRepository
  geminiApiKey: string
  supabase: SupabaseClient
  checkUsageLimit: CheckUsageLimitUseCase
  getUsageInfo: GetUsageInfoUseCase
  chat: ChatUseCase
  flushPostHog: () => Promise<void>
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createAIDependencies(options: CreateDependenciesOptions): AIDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new AIRepository(supabase)

  const geminiApiKey = options.env.GEMINI_API_KEY
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const posthog = createServerPostHog(options.env)

  const expensesRepository = new ExpensesRepository(supabase)
  const createExpenseUseCase = new CreateExpenseUseCase(expensesRepository)
  const creditCardsRepository = new CreditCardsRepository(supabase)
  const updateCreditCardUseCase = new UpdateCreditCardUseCase(creditCardsRepository)
  const invoicesRepository = new InvoicesRepository(supabase)
  const getOrCreateInvoiceUseCase = new GetOrCreateInvoiceUseCase(
    invoicesRepository,
    creditCardsRepository
  )
  const getCreditCardLimitUsageUseCase = new GetCreditCardLimitUsageUseCase(
    invoicesRepository,
    creditCardsRepository,
    getOrCreateInvoiceUseCase
  )
  const payInvoiceUseCase = new PayInvoiceUseCase(invoicesRepository, creditCardsRepository)
  const salaryRepository = new SalaryRepository(supabase)
  const createSalaryUseCase = new CreateSalaryUseCase(salaryRepository)

  const chatUseCase = new ChatUseCase({
    geminiApiKey,
    aiRepository: repository,
    supabase,
    createExpenseUseCase,
    createSalaryUseCase,
    expensesRepository,
    updateCreditCardUseCase,
    getOrCreateInvoiceUseCase,
    getCreditCardLimitUsageUseCase,
    payInvoiceUseCase,
    invoicesRepository,
    creditCardsRepository,
    posthog,
  })

  const flushPostHog = async (): Promise<void> => {
    if (posthog) {
      await posthog.flush()
    }
  }

  return {
    repository,
    geminiApiKey,
    supabase,
    checkUsageLimit: new CheckUsageLimitUseCase(repository),
    getUsageInfo: new GetUsageInfoUseCase(repository),
    chat: chatUseCase,
    flushPostHog,
  }
}
