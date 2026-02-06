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
    } else if (type === 'subscription_preapproval') {
      await this.handleCardSubscription(data.id)
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
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + 30)

      await this.repository.upgradeToPro(subscription.user_id, {
        payment_method: 'pix',
        mp_payment_id: paymentId,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
      })
    } else {
      await this.repository.updatePaymentStatus(
        subscription.user_id,
        mpPayment.status as 'pending' | 'approved' | 'cancelled' | 'expired'
      )
    }
  }

  private async handleCardSubscription(preapprovalId: string): Promise<void> {
    const subscription = await this.repository.getByMpPreapprovalId(preapprovalId)
    if (!subscription) return

    const mpPreapproval = await this.mpClient.getSubscriptionStatus(preapprovalId)

    // Idempotency: skip if already in the same status
    if (subscription.mp_payment_status === mpPreapproval.status) return

    await this.repository.logPaymentEvent({
      user_id: subscription.user_id,
      mp_preapproval_id: preapprovalId,
      event_type: `card_${mpPreapproval.status}`,
      amount_cents: Math.round(mpPreapproval.auto_recurring.transaction_amount * 100),
      raw_payload: mpPreapproval,
    })

    if (mpPreapproval.status === 'authorized') {
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      await this.repository.upgradeToPro(subscription.user_id, {
        payment_method: 'credit_card',
        mp_preapproval_id: preapprovalId,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
      })
    } else if (mpPreapproval.status === 'cancelled') {
      // Keep Pro until period ends, just mark as cancelled
      await this.repository.updatePaymentStatus(subscription.user_id, 'cancelled')
    } else {
      await this.repository.updatePaymentStatus(
        subscription.user_id,
        mpPreapproval.status as 'pending' | 'approved' | 'cancelled' | 'expired'
      )
    }
  }
}
