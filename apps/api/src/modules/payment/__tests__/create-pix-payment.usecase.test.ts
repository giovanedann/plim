import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MercadoPagoClient } from '../client/mercado-pago-client'
import {
  CreatePixPaymentUseCase,
  type PixPaymentUrls,
  splitName,
} from '../create-pix-payment.usecase'
import type { PaymentRepository } from '../payment.repository'

const mockRepository = {
  getSubscription: vi.fn(),
  upgradeToPro: vi.fn(),
  downgradeToFree: vi.fn(),
  updatePaymentStatus: vi.fn(),
  setPaymentPending: vi.fn(),
  getByMpPaymentId: vi.fn(),
  logPaymentEvent: vi.fn(),
}

const mockMpClient = {
  createPixPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
}

const mockUrls: PixPaymentUrls = {
  apiBaseUrl: 'https://api.test.plim.app.br',
}

const mockMpPayment = {
  id: 12345,
  status: 'pending',
  point_of_interaction: {
    transaction_data: {
      qr_code_base64: 'base64data',
      qr_code: 'pix-code',
    },
  },
  date_of_expiration: '2026-02-07T00:00:00Z',
}

describe('CreatePixPaymentUseCase', () => {
  let sut: CreatePixPaymentUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    sut = new CreatePixPaymentUseCase(
      mockRepository as unknown as PaymentRepository,
      mockMpClient as unknown as MercadoPagoClient,
      mockUrls
    )
  })

  it('creates pix payment and returns QR code data', async () => {
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    const result = await sut.execute('user-1', { email: 'user@email.com', name: 'Joao Silva' })

    expect(result).toEqual({
      qr_code_base64: 'base64data',
      pix_copia_cola: 'pix-code',
      mp_payment_id: '12345',
      expires_at: '2026-02-07T00:00:00Z',
    })
  })

  it('calls mpClient.createPixPayment with enriched params', async () => {
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    await sut.execute('user-1', { email: 'user@email.com', name: 'Joao Silva' })

    expect(mockMpClient.createPixPayment).toHaveBeenCalledWith({
      email: 'user@email.com',
      amountBrl: 0.5,
      notificationUrl: 'https://api.test.plim.app.br/api/v1/webhooks/mercadopago',
      externalReference: 'plim-pro-user-1',
      statementDescriptor: 'PLIM PRO',
      firstName: 'Joao',
      lastName: 'Silva',
    })
  })

  it('omits firstName and lastName when name is null', async () => {
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    await sut.execute('user-1', { email: 'user@email.com', name: null })

    expect(mockMpClient.createPixPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: undefined,
        lastName: undefined,
      })
    )
  })

  it('sets only firstName when name is a single word', async () => {
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    await sut.execute('user-1', { email: 'user@email.com', name: 'Joao' })

    expect(mockMpClient.createPixPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Joao',
        lastName: undefined,
      })
    )
  })

  it('omits notificationUrl when apiBaseUrl is not HTTPS', async () => {
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    const localSut = new CreatePixPaymentUseCase(
      mockRepository as unknown as PaymentRepository,
      mockMpClient as unknown as MercadoPagoClient,
      { apiBaseUrl: 'http://localhost:8787' }
    )

    await localSut.execute('user-1', { email: 'user@email.com', name: 'Joao' })

    expect(mockMpClient.createPixPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationUrl: undefined,
      })
    )
  })

  it('calls setPaymentPending with pix payment data', async () => {
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    await sut.execute('user-1', { email: 'user@email.com', name: 'Joao Silva' })

    expect(mockRepository.setPaymentPending).toHaveBeenCalledWith('user-1', {
      payment_method: 'pix',
      mp_payment_id: '12345',
    })
  })

  it('logs pix_payment_created event', async () => {
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    await sut.execute('user-1', { email: 'user@email.com', name: 'Joao Silva' })

    expect(mockRepository.logPaymentEvent).toHaveBeenCalledWith({
      user_id: 'user-1',
      mp_payment_id: '12345',
      event_type: 'pix_payment_created',
      amount_cents: 50,
      raw_payload: { mp_id: 12345, status: 'pending' },
    })
  })
})

describe('splitName', () => {
  it('returns empty object for null', () => {
    expect(splitName(null)).toEqual({})
  })

  it('returns empty object for empty string', () => {
    expect(splitName('')).toEqual({})
  })

  it('returns firstName only for single word', () => {
    expect(splitName('Joao')).toEqual({ firstName: 'Joao' })
  })

  it('returns firstName and lastName for two words', () => {
    expect(splitName('Joao Silva')).toEqual({ firstName: 'Joao', lastName: 'Silva' })
  })

  it('joins remaining words into lastName for multiple words', () => {
    expect(splitName('Joao da Silva')).toEqual({ firstName: 'Joao', lastName: 'da Silva' })
  })

  it('trims whitespace', () => {
    expect(splitName('  Joao  Silva  ')).toEqual({ firstName: 'Joao', lastName: 'Silva' })
  })
})
