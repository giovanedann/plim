import type { CreditCard } from '@plim/shared'
import type { ListCreditCardsUseCase } from '../list-credit-cards.usecase'

export async function listCreditCardsController(
  userId: string,
  listCreditCardsUseCase: ListCreditCardsUseCase
): Promise<CreditCard[]> {
  return listCreditCardsUseCase.execute(userId)
}
