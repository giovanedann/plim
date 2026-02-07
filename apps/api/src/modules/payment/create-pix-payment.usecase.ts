import type { PixPaymentResponse } from '@plim/shared'
import type { CreatePixPaymentParams, MercadoPagoClient } from './client/mercado-pago-client'
import type { PaymentRepository } from './payment.repository'

const PRO_PRICE_BRL = 24.9

export interface PixPaymentUrls {
  apiBaseUrl: string
}

export function splitName(name: string | null): { firstName?: string; lastName?: string } {
  if (!name) return {}
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === '') return {}
  if (parts.length === 1) return { firstName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

export class CreatePixPaymentUseCase {
  constructor(
    private repository: PaymentRepository,
    private mpClient: MercadoPagoClient,
    private urls: PixPaymentUrls
  ) {}

  async execute(
    userId: string,
    profile: { email: string; name: string | null }
  ): Promise<PixPaymentResponse> {
    const { firstName, lastName } = splitName(profile.name)

    const notificationUrl = this.urls.apiBaseUrl.startsWith('https://')
      ? `${this.urls.apiBaseUrl}/api/v1/webhooks/mercadopago`
      : undefined

    const params: CreatePixPaymentParams = {
      email: profile.email,
      amountBrl: PRO_PRICE_BRL,
      notificationUrl,
      externalReference: `plim-pro-${userId}`,
      statementDescriptor: 'PLIM PRO',
      firstName,
      lastName,
    }

    const mpPayment = await this.mpClient.createPixPayment(params)

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
