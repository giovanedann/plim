const MP_API_BASE = 'https://api.mercadopago.com'

export interface CreatePixPaymentParams {
  email: string
  amountBrl: number
  notificationUrl?: string
  externalReference: string
  statementDescriptor: string
  firstName?: string
  lastName?: string
}

export interface MpPixPaymentResponse {
  id: number
  status: string
  point_of_interaction: {
    transaction_data: {
      qr_code_base64: string
      qr_code: string
    }
  }
  date_of_expiration: string
}

export interface MpPaymentStatusResponse {
  id: number
  status: string
  status_detail: string
  payer: { email: string }
  transaction_amount: number
  date_approved: string | null
}

export class MercadoPagoClient {
  constructor(private accessToken: string) {}

  async createPixPayment(params: CreatePixPaymentParams): Promise<MpPixPaymentResponse> {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    const payer: Record<string, string> = { email: params.email }
    if (params.firstName) payer.first_name = params.firstName
    if (params.lastName) payer.last_name = params.lastName

    const body: Record<string, unknown> = {
      transaction_amount: params.amountBrl,
      payment_method_id: 'pix',
      payer,
      description: 'Plim Pro - 30 dias',
      date_of_expiration: expiresAt.toISOString(),
      external_reference: params.externalReference,
      statement_descriptor: params.statementDescriptor,
      additional_info: {
        items: [
          {
            id: 'plim-pro-30d',
            title: 'Plim Pro - 30 dias',
            description: 'Assinatura Plim Pro por 30 dias',
            category_id: 'services',
            quantity: 1,
            unit_price: params.amountBrl,
          },
        ],
      },
    }

    if (params.notificationUrl) {
      body.notification_url = params.notificationUrl
    }

    const timeWindow = Math.floor(Date.now() / 300_000)
    const idempotencyKey = `pix-${params.email}-${params.amountBrl}-${timeWindow}`
    return this.request<MpPixPaymentResponse>('POST', '/v1/payments', body, idempotencyKey)
  }

  async getPaymentStatus(paymentId: string): Promise<MpPaymentStatusResponse> {
    return this.request<MpPaymentStatusResponse>('GET', `/v1/payments/${paymentId}`)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    idempotencyKey?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }

    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey
    }

    const response = await fetch(`${MP_API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Mercado Pago API error: ${response.status} ${response.statusText} - ${errorBody}`
      )
    }

    return (await response.json()) as T
  }
}
