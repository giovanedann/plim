import type { CreateCreditCard, CreditCard } from '@plim/shared'
import type { CreateCreditCardUseCase } from '../create-credit-card.usecase'

export async function createCreditCardController(
  userId: string,
  input: CreateCreditCard,
  createCreditCardUseCase: CreateCreditCardUseCase
): Promise<CreditCard> {
  return createCreditCardUseCase.execute(userId, input)
}
