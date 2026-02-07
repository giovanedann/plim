import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MercadoPagoClient } from '../client/mercado-pago-client'
import { HandleWebhookUseCase } from '../handle-webhook.usecase'
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

const mockSubscription = {
  id: 'sub-1',
  user_id: 'user-1',
  tier: 'free' as const,
  ai_requests_limit: 20,
  ai_text_limit: 15,
  ai_voice_limit: 2,
  ai_image_limit: 3,
  payment_method: 'pix' as const,
  mp_payment_id: 'pay-123',
  mp_preapproval_id: null,
  mp_payment_status: 'pending' as const,
  current_period_start: null,
  current_period_end: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

describe('HandleWebhookUseCase', () => {
  let sut: HandleWebhookUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-01T12:00:00Z'))
    sut = new HandleWebhookUseCase(
      mockRepository as unknown as PaymentRepository,
      mockMpClient as unknown as MercadoPagoClient
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('PIX payment webhook', () => {
    it('upgrades to pro when payment is approved', async () => {
      mockRepository.getByMpPaymentId.mockResolvedValue(mockSubscription)
      mockRepository.getSubscription.mockResolvedValue(mockSubscription)
      mockMpClient.getPaymentStatus.mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payer: { email: 'user@email.com' },
        transaction_amount: 24.9,
        date_approved: '2026-02-01T12:00:00Z',
      })

      await sut.execute({ action: 'payment.updated', type: 'payment', data: { id: 'pay-123' } })

      expect(mockRepository.upgradeToPro).toHaveBeenCalledWith('user-1', {
        payment_method: 'pix',
        mp_payment_id: 'pay-123',
        period_start: '2026-02-01T12:00:00.000Z',
        period_end: '2026-03-03T12:00:00.000Z',
      })
    })

    it('updates payment status when payment is pending', async () => {
      const subscriptionApproved = { ...mockSubscription, mp_payment_status: 'approved' as const }
      mockRepository.getByMpPaymentId.mockResolvedValue(subscriptionApproved)
      mockMpClient.getPaymentStatus.mockResolvedValue({
        id: 12345,
        status: 'pending',
        status_detail: 'pending_waiting_payment',
        payer: { email: 'user@email.com' },
        transaction_amount: 24.9,
        date_approved: null,
      })

      await sut.execute({ action: 'payment.updated', type: 'payment', data: { id: 'pay-123' } })

      expect(mockRepository.updatePaymentStatus).toHaveBeenCalledWith('user-1', 'pending')
      expect(mockRepository.upgradeToPro).not.toHaveBeenCalled()
    })

    it('skips processing when status has not changed (idempotency)', async () => {
      mockRepository.getByMpPaymentId.mockResolvedValue(mockSubscription)
      mockMpClient.getPaymentStatus.mockResolvedValue({
        id: 12345,
        status: 'pending',
        status_detail: 'pending_waiting_payment',
        payer: { email: 'user@email.com' },
        transaction_amount: 24.9,
        date_approved: null,
      })

      await sut.execute({ action: 'payment.updated', type: 'payment', data: { id: 'pay-123' } })

      expect(mockRepository.upgradeToPro).not.toHaveBeenCalled()
      expect(mockRepository.updatePaymentStatus).not.toHaveBeenCalled()
      expect(mockRepository.logPaymentEvent).not.toHaveBeenCalled()
    })

    it('does nothing when subscription is not found', async () => {
      mockRepository.getByMpPaymentId.mockResolvedValue(null)

      await sut.execute({ action: 'payment.updated', type: 'payment', data: { id: 'pay-999' } })

      expect(mockMpClient.getPaymentStatus).not.toHaveBeenCalled()
      expect(mockRepository.upgradeToPro).not.toHaveBeenCalled()
      expect(mockRepository.updatePaymentStatus).not.toHaveBeenCalled()
    })

    it('extends from current expiry for early renewal (active Pro)', async () => {
      const activeProSubscription = {
        ...mockSubscription,
        tier: 'pro' as const,
        mp_payment_status: 'pending' as const,
        current_period_start: '2026-02-01T12:00:00.000Z',
        current_period_end: '2026-02-15T12:00:00.000Z',
      }
      mockRepository.getByMpPaymentId.mockResolvedValue(activeProSubscription)
      mockRepository.getSubscription.mockResolvedValue(activeProSubscription)
      mockMpClient.getPaymentStatus.mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payer: { email: 'user@email.com' },
        transaction_amount: 24.9,
        date_approved: '2026-02-01T12:00:00Z',
      })

      await sut.execute({ action: 'payment.updated', type: 'payment', data: { id: 'pay-123' } })

      expect(mockRepository.upgradeToPro).toHaveBeenCalledWith('user-1', {
        payment_method: 'pix',
        mp_payment_id: 'pay-123',
        period_start: '2026-02-15T12:00:00.000Z',
        period_end: '2026-03-17T12:00:00.000Z',
      })
    })

    it('starts from now for expired Pro renewal', async () => {
      const expiredProSubscription = {
        ...mockSubscription,
        tier: 'pro' as const,
        mp_payment_status: 'pending' as const,
        current_period_start: '2026-01-01T12:00:00.000Z',
        current_period_end: '2026-01-31T12:00:00.000Z',
      }
      mockRepository.getByMpPaymentId.mockResolvedValue(expiredProSubscription)
      mockRepository.getSubscription.mockResolvedValue(expiredProSubscription)
      mockMpClient.getPaymentStatus.mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payer: { email: 'user@email.com' },
        transaction_amount: 24.9,
        date_approved: '2026-02-01T12:00:00Z',
      })

      await sut.execute({ action: 'payment.updated', type: 'payment', data: { id: 'pay-123' } })

      expect(mockRepository.upgradeToPro).toHaveBeenCalledWith('user-1', {
        payment_method: 'pix',
        mp_payment_id: 'pay-123',
        period_start: '2026-02-01T12:00:00.000Z',
        period_end: '2026-03-03T12:00:00.000Z',
      })
    })

    it('starts from now for first-time upgrade (free user)', async () => {
      mockRepository.getByMpPaymentId.mockResolvedValue(mockSubscription)
      mockRepository.getSubscription.mockResolvedValue(mockSubscription)
      mockMpClient.getPaymentStatus.mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payer: { email: 'user@email.com' },
        transaction_amount: 24.9,
        date_approved: '2026-02-01T12:00:00Z',
      })

      await sut.execute({ action: 'payment.updated', type: 'payment', data: { id: 'pay-123' } })

      expect(mockRepository.upgradeToPro).toHaveBeenCalledWith('user-1', {
        payment_method: 'pix',
        mp_payment_id: 'pay-123',
        period_start: '2026-02-01T12:00:00.000Z',
        period_end: '2026-03-03T12:00:00.000Z',
      })
    })

    it('logs payment event on status change', async () => {
      mockRepository.getByMpPaymentId.mockResolvedValue(mockSubscription)
      mockRepository.getSubscription.mockResolvedValue(mockSubscription)
      mockMpClient.getPaymentStatus.mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payer: { email: 'user@email.com' },
        transaction_amount: 24.9,
        date_approved: '2026-02-01T12:00:00Z',
      })

      await sut.execute({ action: 'payment.updated', type: 'payment', data: { id: 'pay-123' } })

      expect(mockRepository.logPaymentEvent).toHaveBeenCalledWith({
        user_id: 'user-1',
        mp_payment_id: 'pay-123',
        event_type: 'pix_approved',
        amount_cents: 2490,
        raw_payload: {
          id: 12345,
          status: 'approved',
          status_detail: 'accredited',
          payer: { email: 'user@email.com' },
          transaction_amount: 24.9,
          date_approved: '2026-02-01T12:00:00Z',
        },
      })
    })
  })

  describe('unknown webhook type', () => {
    it('does nothing for unrecognized type', async () => {
      await sut.execute({ action: 'updated', type: 'unknown_type', data: { id: 'some-id' } })

      expect(mockRepository.getByMpPaymentId).not.toHaveBeenCalled()
      expect(mockRepository.upgradeToPro).not.toHaveBeenCalled()
      expect(mockRepository.updatePaymentStatus).not.toHaveBeenCalled()
    })
  })
})
