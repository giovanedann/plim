import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { CreateCreditCardUseCase } from './create-credit-card.usecase'
import { CreditCardsRepository } from './credit-cards.repository'
import { DeleteCreditCardUseCase } from './delete-credit-card.usecase'
import { ListCreditCardsUseCase } from './list-credit-cards.usecase'
import { UpdateCreditCardUseCase } from './update-credit-card.usecase'

export interface CreditCardsDependencies {
  repository: CreditCardsRepository
  listCreditCards: ListCreditCardsUseCase
  createCreditCard: CreateCreditCardUseCase
  updateCreditCard: UpdateCreditCardUseCase
  deleteCreditCard: DeleteCreditCardUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createCreditCardsDependencies(
  options: CreateDependenciesOptions
): CreditCardsDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new CreditCardsRepository(supabase)
  return {
    repository,
    listCreditCards: new ListCreditCardsUseCase(repository),
    createCreditCard: new CreateCreditCardUseCase(repository, supabase),
    updateCreditCard: new UpdateCreditCardUseCase(repository),
    deleteCreditCard: new DeleteCreditCardUseCase(repository),
  }
}
