import type { MercadoPagoClient } from './client/mercado-pago-client'
import type { PaymentRepository } from './payment.repository'

interface WebhookPayload {
  action: string
  type: string
  data: { id: string }
}

export class HandleWebhookUseCase {
  constructor(
    private repository: PaymentRepository,
    private mpClient: MercadoPagoClient
  ) {}

  async execute(payload: WebhookPayload): Promise<void> {
    const { type, data } = payload

    if (type === 'payment') {
      await this.handlePixPayment(data.id)
    }
  }

  private async handlePixPayment(paymentId: string): Promise<void> {
    const subscription = await this.repository.getByMpPaymentId(paymentId)
    if (!subscription) return

    const mpPayment = await this.mpClient.getPaymentStatus(paymentId)

    // Idempotency: skip if already in the same status
    if (subscription.mp_payment_status === mpPayment.status) return

    await this.repository.logPaymentEvent({
      user_id: subscription.user_id,
      mp_payment_id: paymentId,
      event_type: `pix_${mpPayment.status}`,
      amount_cents: Math.round(mpPayment.transaction_amount * 100),
      raw_payload: mpPayment,
    })

    if (mpPayment.status === 'approved') {
      const now = new Date()

      const currentSub = await this.repository.getSubscription(subscription.user_id)
      const isActivePro =
        currentSub?.tier === 'pro' &&
        currentSub.current_period_end !== null &&
        new Date(currentSub.current_period_end) > now

      const periodStart = isActivePro ? new Date(currentSub.current_period_end!) : now

      const periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 30)

      await this.repository.upgradeToPro(subscription.user_id, {
        payment_method: 'pix',
        mp_payment_id: paymentId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      })
    } else {
      await this.repository.updatePaymentStatus(
        subscription.user_id,
        mpPayment.status as 'pending' | 'approved' | 'cancelled' | 'expired'
      )
    }
  }
}
