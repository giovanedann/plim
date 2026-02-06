const MP_API_BASE = 'https://api.mercadopago.com'

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

export interface MpPreApprovalResponse {
  id: string
  status: string
  init_point: string
  payer_id: number
  auto_recurring: {
    frequency: number
    frequency_type: string
    transaction_amount: number
    currency_id: string
  }
}

export interface MpPreApprovalStatusResponse {
  id: string
  status: string
  payer_id: number
  auto_recurring: {
    frequency: number
    frequency_type: string
    transaction_amount: number
    currency_id: string
  }
  next_payment_date: string | null
}

export class MercadoPagoClient {
  constructor(private accessToken: string) {}

  async createPixPayment(email: string, amountBrl: number): Promise<MpPixPaymentResponse> {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    const body = {
      transaction_amount: amountBrl,
      payment_method_id: 'pix',
      payer: { email },
      description: 'Plim Pro - 30 dias',
      date_of_expiration: expiresAt.toISOString(),
    }

    const response = await this.request<MpPixPaymentResponse>('POST', '/v1/payments', body)
    return response
  }

  async getPaymentStatus(paymentId: string): Promise<MpPaymentStatusResponse> {
    return this.request<MpPaymentStatusResponse>('GET', `/v1/payments/${paymentId}`)
  }

  async createCardSubscription(email: string, amountBrl: number): Promise<MpPreApprovalResponse> {
    const body = {
      reason: 'Plim Pro - Assinatura mensal',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: amountBrl,
        currency_id: 'BRL',
      },
      payer_email: email,
      back_url: 'https://plim.app.br/upgrade',
      status: 'pending',
    }

    return this.request<MpPreApprovalResponse>('POST', '/preapproval', body)
  }

  async getSubscriptionStatus(preapprovalId: string): Promise<MpPreApprovalStatusResponse> {
    return this.request<MpPreApprovalStatusResponse>('GET', `/preapproval/${preapprovalId}`)
  }

  async cancelSubscription(preapprovalId: string): Promise<MpPreApprovalStatusResponse> {
    return this.request<MpPreApprovalStatusResponse>('PUT', `/preapproval/${preapprovalId}`, {
      status: 'cancelled',
    })
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${MP_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
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
