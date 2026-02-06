import type { CardSubscriptionResponse } from '@plim/shared'
import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { MercadoPagoClient } from './client/mercado-pago-client'
import type { PaymentRepository } from './payment.repository'

const PRO_PRICE_BRL = 24.9

export class CreateCardSubscriptionUseCase {
  constructor(
    private repository: PaymentRepository,
    private mpClient: MercadoPagoClient
  ) {}

  async execute(userId: string, email: string): Promise<CardSubscriptionResponse> {
    const subscription = await this.repository.getSubscription(userId)

    if (
      subscription?.tier === 'pro' &&
      subscription.payment_method === 'credit_card' &&
      subscription.mp_payment_status === 'approved'
    ) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Voce ja possui uma assinatura ativa com cartao de credito',
        HTTP_STATUS.FORBIDDEN
      )
    }

    const mpPreApproval = await this.mpClient.createCardSubscription(email, PRO_PRICE_BRL)

    await this.repository.setPaymentPending(userId, {
      payment_method: 'credit_card',
      mp_preapproval_id: mpPreApproval.id,
    })

    await this.repository.logPaymentEvent({
      user_id: userId,
      mp_preapproval_id: mpPreApproval.id,
      event_type: 'card_subscription_created',
      amount_cents: Math.round(PRO_PRICE_BRL * 100),
      raw_payload: { mp_id: mpPreApproval.id, status: mpPreApproval.status },
    })

    return {
      init_point: mpPreApproval.init_point,
      mp_preapproval_id: mpPreApproval.id,
    }
  }
}
