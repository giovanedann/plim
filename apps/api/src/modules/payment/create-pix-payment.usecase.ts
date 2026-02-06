import type { PixPaymentResponse } from '@plim/shared'
import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { MercadoPagoClient } from './client/mercado-pago-client'
import type { PaymentRepository } from './payment.repository'

const PRO_PRICE_BRL = 24.9

export class CreatePixPaymentUseCase {
  constructor(
    private repository: PaymentRepository,
    private mpClient: MercadoPagoClient
  ) {}

  async execute(userId: string, email: string): Promise<PixPaymentResponse> {
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

    const mpPayment = await this.mpClient.createPixPayment(email, PRO_PRICE_BRL)

    await this.repository.setPaymentPending(userId, {
      payment_method: 'pix',
      mp_payment_id: String(mpPayment.id),
    })

    await this.repository.logPaymentEvent({
      user_id: userId,
      mp_payment_id: String(mpPayment.id),
      event_type: 'pix_payment_created',
      amount_cents: Math.round(PRO_PRICE_BRL * 100),
      raw_payload: { mp_id: mpPayment.id, status: mpPayment.status },
    })

    return {
      qr_code_base64: mpPayment.point_of_interaction.transaction_data.qr_code_base64,
      pix_copia_cola: mpPayment.point_of_interaction.transaction_data.qr_code,
      mp_payment_id: String(mpPayment.id),
      expires_at: mpPayment.date_of_expiration,
    }
  }
}
