import type { DeleteCreditCardUseCase } from '../delete-credit-card.usecase'

export async function deleteCreditCardController(
  userId: string,
  creditCardId: string,
  deleteCreditCardUseCase: DeleteCreditCardUseCase
): Promise<void> {
  return deleteCreditCardUseCase.execute(userId, creditCardId)
}
