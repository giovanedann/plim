import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../../middleware/error-handler.middleware'
import { CancelSubscriptionUseCase } from '../cancel-subscription.usecase'
import type { MercadoPagoClient } from '../client/mercado-pago-client'
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

describe('CancelSubscriptionUseCase', () => {
  let sut: CancelSubscriptionUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    sut = new CancelSubscriptionUseCase(
      mockRepository as unknown as PaymentRepository,
      mockMpClient as unknown as MercadoPagoClient
    )
  })

  it('cancels credit card subscription via MercadoPago API', async () => {
    mockRepository.getSubscription.mockResolvedValue({
      tier: 'pro',
      payment_method: 'credit_card',
      mp_preapproval_id: 'preapproval-123',
      mp_payment_id: null,
    })

    await sut.execute('user-1')

    expect(mockMpClient.cancelSubscription).toHaveBeenCalledWith('preapproval-123')
  })

  it('does not call MercadoPago API for pix cancellation', async () => {
    mockRepository.getSubscription.mockResolvedValue({
      tier: 'pro',
      payment_method: 'pix',
      mp_preapproval_id: null,
      mp_payment_id: 'pay-123',
    })

    await sut.execute('user-1')

    expect(mockMpClient.cancelSubscription).not.toHaveBeenCalled()
  })

  it('throws when user has no subscription', async () => {
    mockRepository.getSubscription.mockResolvedValue(null)

    const error = await sut.execute('user-1').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({
      code: ERROR_CODES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    })
  })

  it('throws when subscription tier is free', async () => {
    mockRepository.getSubscription.mockResolvedValue({
      tier: 'free',
      payment_method: null,
      mp_preapproval_id: null,
      mp_payment_id: null,
    })

    const error = await sut.execute('user-1').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({
      code: ERROR_CODES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    })
  })

  it('returns success true after cancellation', async () => {
    mockRepository.getSubscription.mockResolvedValue({
      tier: 'pro',
      payment_method: 'pix',
      mp_preapproval_id: null,
      mp_payment_id: 'pay-123',
    })

    const result = await sut.execute('user-1')

    expect(result).toEqual({ success: true })
  })

  it('updates payment status to cancelled', async () => {
    mockRepository.getSubscription.mockResolvedValue({
      tier: 'pro',
      payment_method: 'pix',
      mp_preapproval_id: null,
      mp_payment_id: 'pay-123',
    })

    await sut.execute('user-1')

    expect(mockRepository.updatePaymentStatus).toHaveBeenCalledWith('user-1', 'cancelled')
  })

  it('logs subscription_cancelled event', async () => {
    mockRepository.getSubscription.mockResolvedValue({
      tier: 'pro',
      payment_method: 'credit_card',
      mp_preapproval_id: 'preapproval-123',
      mp_payment_id: null,
    })

    await sut.execute('user-1')

    expect(mockRepository.logPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        mp_preapproval_id: 'preapproval-123',
        event_type: 'subscription_cancelled',
        raw_payload: expect.objectContaining({
          payment_method: 'credit_card',
          cancelled_at: expect.any(String),
        }),
      })
    )
  })
})
