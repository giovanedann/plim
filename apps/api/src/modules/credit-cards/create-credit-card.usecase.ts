import type { CreateCreditCard, CreditCard } from '@plim/shared'
import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkPlanLimit } from '../../lib/check-plan-limit'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from './credit-cards.repository'

export class CreateCreditCardUseCase {
  constructor(
    private repository: CreditCardsRepository,
    private supabase: SupabaseClient
  ) {}

  async execute(userId: string, input: CreateCreditCard): Promise<CreditCard> {
    const currentCount = await this.repository.countByUserId(userId)

    await checkPlanLimit({
      supabase: this.supabase,
      userId,
      feature: 'creditCards',
      currentCount,
    })

    const creditCard = await this.repository.create(userId, input)

    if (!creditCard) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create credit card',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return creditCard
  }
}
