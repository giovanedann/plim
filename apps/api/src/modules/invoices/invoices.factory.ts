import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { CreditCardsRepository } from '../credit-cards/credit-cards.repository'
import { GetCreditCardLimitUsageUseCase } from './get-credit-card-limit-usage.usecase'
import { GetOrCreateInvoiceUseCase } from './get-or-create-invoice.usecase'
import { InvoicesRepository } from './invoices.repository'
import { PayInvoiceUseCase } from './pay-invoice.usecase'

export interface InvoicesDependencies {
  invoicesRepository: InvoicesRepository
  creditCardsRepository: CreditCardsRepository
  getOrCreateInvoice: GetOrCreateInvoiceUseCase
  payInvoice: PayInvoiceUseCase
  getCreditCardLimitUsage: GetCreditCardLimitUsageUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createInvoicesDependencies(
  options: CreateDependenciesOptions
): InvoicesDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const invoicesRepository = new InvoicesRepository(supabase)
  const creditCardsRepository = new CreditCardsRepository(supabase)

  return {
    invoicesRepository,
    creditCardsRepository,
    getOrCreateInvoice: new GetOrCreateInvoiceUseCase(invoicesRepository, creditCardsRepository),
    payInvoice: new PayInvoiceUseCase(invoicesRepository),
    getCreditCardLimitUsage: new GetCreditCardLimitUsageUseCase(
      invoicesRepository,
      creditCardsRepository,
      new GetOrCreateInvoiceUseCase(invoicesRepository, creditCardsRepository)
    ),
  }
}
