import type { CreditCard, UpdateCreditCard } from '@plim/shared'
import type { UpdateCreditCardUseCase } from '../update-credit-card.usecase'

export async function updateCreditCardController(
  userId: string,
  creditCardId: string,
  input: UpdateCreditCard,
  updateCreditCardUseCase: UpdateCreditCardUseCase
): Promise<CreditCard> {
  return updateCreditCardUseCase.execute(userId, creditCardId, input)
}
