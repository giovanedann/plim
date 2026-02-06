import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../../middleware/error-handler.middleware'
import type { MercadoPagoClient } from '../client/mercado-pago-client'
import { CreatePixPaymentUseCase } from '../create-pix-payment.usecase'
import type { PaymentRepository } from '../payment.repository'

const mockRepository = {
  getSubscription: vi.fn(),
  upgradeToPro: vi.fn(),
  downgradeToFree: vi.fn(),
  updatePaymentStatus: vi.fn(),
  setPaymentPending: vi.fn(),
  getByMpPaymentId: vi.fn(),
  getByMpPreapprovalId: vi.fn(),
  logPaymentEvent: vi.fn(),
}

const mockMpClient = {
  createPixPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
  createCardSubscription: vi.fn(),
  getSubscriptionStatus: vi.fn(),
  cancelSubscription: vi.fn(),
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
      mockMpClient as unknown as MercadoPagoClient
    )
  })

  it('creates pix payment and returns QR code data', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    const result = await sut.execute('user-1', 'user@email.com')

    expect(result).toEqual({
      qr_code_base64: 'base64data',
      pix_copia_cola: 'pix-code',
      mp_payment_id: '12345',
      expires_at: '2026-02-07T00:00:00Z',
    })
  })

  it('calls mpClient.createPixPayment with email and price', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    await sut.execute('user-1', 'user@email.com')

    expect(mockMpClient.createPixPayment).toHaveBeenCalledWith('user@email.com', 24.9)
  })

  it('rejects when user has active card subscription', async () => {
    mockRepository.getSubscription.mockResolvedValue({
      tier: 'pro',
      payment_method: 'credit_card',
      mp_payment_status: 'approved',
    })

    const error = await sut.execute('user-1', 'user@email.com').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({
      code: ERROR_CODES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    })
  })

  it('allows payment when user has no subscription', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    const result = await sut.execute('user-1', 'user@email.com')

    expect(result.mp_payment_id).toBe('12345')
  })

  it('allows payment when subscription is cancelled', async () => {
    mockRepository.getSubscription.mockResolvedValue({
      tier: 'pro',
      payment_method: 'credit_card',
      mp_payment_status: 'cancelled',
    })
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    const result = await sut.execute('user-1', 'user@email.com')

    expect(result.mp_payment_id).toBe('12345')
  })

  it('calls setPaymentPending with pix payment data', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    await sut.execute('user-1', 'user@email.com')

    expect(mockRepository.setPaymentPending).toHaveBeenCalledWith('user-1', {
      payment_method: 'pix',
      mp_payment_id: '12345',
    })
  })

  it('logs pix_payment_created event', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createPixPayment.mockResolvedValue(mockMpPayment)

    await sut.execute('user-1', 'user@email.com')

    expect(mockRepository.logPaymentEvent).toHaveBeenCalledWith({
      user_id: 'user-1',
      mp_payment_id: '12345',
      event_type: 'pix_payment_created',
      amount_cents: 2490,
      raw_payload: { mp_id: 12345, status: 'pending' },
    })
  })
})
