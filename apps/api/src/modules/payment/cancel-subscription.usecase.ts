import type { CancelSubscriptionResponse } from '@plim/shared'
import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { MercadoPagoClient } from './client/mercado-pago-client'
import type { PaymentRepository } from './payment.repository'

export class CancelSubscriptionUseCase {
  constructor(
    private repository: PaymentRepository,
    private mpClient: MercadoPagoClient
  ) {}

  async execute(userId: string): Promise<CancelSubscriptionResponse> {
    const subscription = await this.repository.getSubscription(userId)

    if (!subscription || subscription.tier !== 'pro') {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Voce nao possui uma assinatura ativa para cancelar',
        HTTP_STATUS.FORBIDDEN
      )
    }

    if (subscription.payment_method === 'credit_card' && subscription.mp_preapproval_id) {
      await this.mpClient.cancelSubscription(subscription.mp_preapproval_id)
    }

    await this.repository.updatePaymentStatus(userId, 'cancelled')

    await this.repository.logPaymentEvent({
      user_id: userId,
      mp_payment_id: subscription.mp_payment_id ?? undefined,
      mp_preapproval_id: subscription.mp_preapproval_id ?? undefined,
      event_type: 'subscription_cancelled',
      raw_payload: {
        payment_method: subscription.payment_method,
        cancelled_at: new Date().toISOString(),
      },
    })

    return { success: true }
  }
}
