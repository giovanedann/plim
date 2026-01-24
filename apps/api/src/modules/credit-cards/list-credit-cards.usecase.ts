import type { CreditCard } from '@plim/shared'
import type { CreditCardsRepository } from './credit-cards.repository'

export class ListCreditCardsUseCase {
  constructor(private repository: CreditCardsRepository) {}

  async execute(userId: string): Promise<CreditCard[]> {
    return this.repository.findByUserId(userId)
  }
}
