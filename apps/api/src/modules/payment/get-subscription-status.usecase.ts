import type { SubscriptionStatusResponse } from '@plim/shared'
import type { PaymentRepository } from './payment.repository'

const EXPIRING_SOON_DAYS = 7

export class GetSubscriptionStatusUseCase {
  constructor(private repository: PaymentRepository) {}

  async execute(userId: string): Promise<SubscriptionStatusResponse> {
    const subscription = await this.repository.getSubscription(userId)

    if (!subscription) {
      return {
        tier: 'free',
        payment_method: null,
        current_period_start: null,
        current_period_end: null,
        mp_payment_status: null,
        is_expiring_soon: false,
        days_remaining: null,
      }
    }

    let daysRemaining: number | null = null
    let isExpiringSoon = false

    if (subscription.current_period_end) {
      const now = new Date()
      const periodEnd = new Date(subscription.current_period_end)
      const diffMs = periodEnd.getTime() - now.getTime()
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      isExpiringSoon = daysRemaining <= EXPIRING_SOON_DAYS && daysRemaining > 0
    }

    return {
      tier: subscription.tier,
      payment_method: subscription.payment_method,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      mp_payment_status: subscription.mp_payment_status,
      is_expiring_soon: isExpiringSoon,
      days_remaining: daysRemaining,
    }
  }
}
