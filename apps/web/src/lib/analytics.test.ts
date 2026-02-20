import { beforeEach, describe, expect, it, vi } from 'vitest'
import { analytics } from './analytics'

const mockCapture = vi.fn()
const mockGetPostHog = vi.fn()

vi.mock('./posthog', () => ({
  getPostHog: () => mockGetPostHog(),
}))

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPostHog.mockReturnValue({ capture: mockCapture })
  })

  it('captures sign_up with method', () => {
    analytics.signUp('email')
    expect(mockCapture).toHaveBeenCalledWith('sign_up', { method: 'email' })
  })

  it('captures sign_up with google method', () => {
    analytics.signUp('google')
    expect(mockCapture).toHaveBeenCalledWith('sign_up', { method: 'google' })
  })

  it('captures sign_in with method', () => {
    analytics.signIn('email')
    expect(mockCapture).toHaveBeenCalledWith('sign_in', { method: 'email' })
  })

  it('captures onboarding_completed', () => {
    analytics.onboardingCompleted()
    expect(mockCapture).toHaveBeenCalledWith('onboarding_completed')
  })

  it('captures onboarding_skipped with step', () => {
    analytics.onboardingSkipped(3)
    expect(mockCapture).toHaveBeenCalledWith('onboarding_skipped', { step: 3 })
  })

  it('captures expense_created with type', () => {
    analytics.expenseCreated('recurring')
    expect(mockCapture).toHaveBeenCalledWith('expense_created', { type: 'recurring' })
  })

  it('captures ai_message_sent with input_mode', () => {
    analytics.aiMessageSent('voice')
    expect(mockCapture).toHaveBeenCalledWith('ai_message_sent', { input_mode: 'voice' })
  })

  it('captures upgrade_page_viewed', () => {
    analytics.upgradePageViewed()
    expect(mockCapture).toHaveBeenCalledWith('upgrade_page_viewed')
  })

  it('captures payment_initiated', () => {
    analytics.paymentInitiated()
    expect(mockCapture).toHaveBeenCalledWith('payment_initiated')
  })

  it('captures payment_completed', () => {
    analytics.paymentCompleted()
    expect(mockCapture).toHaveBeenCalledWith('payment_completed')
  })

  it('captures category_created', () => {
    analytics.categoryCreated()
    expect(mockCapture).toHaveBeenCalledWith('category_created')
  })

  it('captures credit_card_added', () => {
    analytics.creditCardAdded()
    expect(mockCapture).toHaveBeenCalledWith('credit_card_added')
  })

  it('captures referral_link_viewed with code', () => {
    analytics.referralLinkViewed('abc-123')
    expect(mockCapture).toHaveBeenCalledWith('referral_link_viewed', { code: 'abc-123' })
  })

  it('captures referral_link_copied', () => {
    analytics.referralLinkCopied()
    expect(mockCapture).toHaveBeenCalledWith('referral_link_copied')
  })

  it('captures referral_link_shared with whatsapp method', () => {
    analytics.referralLinkShared('whatsapp')
    expect(mockCapture).toHaveBeenCalledWith('referral_link_shared', { method: 'whatsapp' })
  })

  it('captures referral_link_shared with native method', () => {
    analytics.referralLinkShared('native')
    expect(mockCapture).toHaveBeenCalledWith('referral_link_shared', { method: 'native' })
  })

  it('captures referral_claimed with code', () => {
    analytics.referralClaimed('abc-123')
    expect(mockCapture).toHaveBeenCalledWith('referral_claimed', { code: 'abc-123' })
  })

  describe('when PostHog is not initialized', () => {
    it('does not throw when getPostHog returns null', () => {
      mockGetPostHog.mockReturnValue(null)

      expect(() => analytics.signUp('email')).not.toThrow()
      expect(() => analytics.signIn('google')).not.toThrow()
      expect(() => analytics.onboardingCompleted()).not.toThrow()
      expect(() => analytics.aiMessageSent('text')).not.toThrow()
      expect(() => analytics.upgradePageViewed()).not.toThrow()
      expect(() => analytics.paymentInitiated()).not.toThrow()
      expect(() => analytics.paymentCompleted()).not.toThrow()
      expect(() => analytics.referralLinkViewed('test')).not.toThrow()
      expect(() => analytics.referralLinkCopied()).not.toThrow()
      expect(() => analytics.referralLinkShared('whatsapp')).not.toThrow()
      expect(() => analytics.referralClaimed('test')).not.toThrow()
      expect(mockCapture).not.toHaveBeenCalled()
    })
  })
})
