import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../../middleware/error-handler.middleware'
import type { MercadoPagoClient } from '../client/mercado-pago-client'
import { CreateCardSubscriptionUseCase } from '../create-card-subscription.usecase'
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

const mockMpPreApproval = {
  id: 'preapproval-123',
  status: 'pending',
  init_point: 'https://mercadopago.com/checkout/123',
  payer_id: 1,
  auto_recurring: {
    frequency: 1,
    frequency_type: 'months',
    transaction_amount: 24.9,
    currency_id: 'BRL',
  },
}

describe('CreateCardSubscriptionUseCase', () => {
  let sut: CreateCardSubscriptionUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    sut = new CreateCardSubscriptionUseCase(
      mockRepository as unknown as PaymentRepository,
      mockMpClient as unknown as MercadoPagoClient
    )
  })

  it('creates card subscription and returns init_point', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createCardSubscription.mockResolvedValue(mockMpPreApproval)

    const result = await sut.execute('user-1', 'user@email.com')

    expect(result).toEqual({
      init_point: 'https://mercadopago.com/checkout/123',
      mp_preapproval_id: 'preapproval-123',
    })
  })

  it('calls mpClient.createCardSubscription with email and price', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createCardSubscription.mockResolvedValue(mockMpPreApproval)

    await sut.execute('user-1', 'user@email.com')

    expect(mockMpClient.createCardSubscription).toHaveBeenCalledWith('user@email.com', 24.9)
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

  it('allows subscription when user has no existing subscription', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createCardSubscription.mockResolvedValue(mockMpPreApproval)

    const result = await sut.execute('user-1', 'user@email.com')

    expect(result.mp_preapproval_id).toBe('preapproval-123')
  })

  it('calls setPaymentPending with credit_card payment data', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createCardSubscription.mockResolvedValue(mockMpPreApproval)

    await sut.execute('user-1', 'user@email.com')

    expect(mockRepository.setPaymentPending).toHaveBeenCalledWith('user-1', {
      payment_method: 'credit_card',
      mp_preapproval_id: 'preapproval-123',
    })
  })

  it('logs card_subscription_created event', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)
    mockMpClient.createCardSubscription.mockResolvedValue(mockMpPreApproval)

    await sut.execute('user-1', 'user@email.com')

    expect(mockRepository.logPaymentEvent).toHaveBeenCalledWith({
      user_id: 'user-1',
      mp_preapproval_id: 'preapproval-123',
      event_type: 'card_subscription_created',
      amount_cents: 2490,
      raw_payload: { mp_id: 'preapproval-123', status: 'pending' },
    })
  })
})
