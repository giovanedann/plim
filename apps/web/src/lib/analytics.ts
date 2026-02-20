import { getPostHog } from './posthog'

export const analytics = {
  signUp(method: 'email' | 'google'): void {
    getPostHog()?.capture('sign_up', { method })
  },

  signIn(method: 'email' | 'google'): void {
    getPostHog()?.capture('sign_in', { method })
  },

  onboardingCompleted(): void {
    getPostHog()?.capture('onboarding_completed')
  },

  onboardingSkipped(step: number): void {
    getPostHog()?.capture('onboarding_skipped', { step })
  },

  expenseCreated(type: 'one_time' | 'recurring' | 'installment'): void {
    getPostHog()?.capture('expense_created', { type })
  },

  aiMessageSent(inputMode: 'text' | 'voice' | 'image'): void {
    getPostHog()?.capture('ai_message_sent', { input_mode: inputMode })
  },

  upgradePageViewed(): void {
    getPostHog()?.capture('upgrade_page_viewed')
  },

  paymentInitiated(): void {
    getPostHog()?.capture('payment_initiated')
  },

  paymentCompleted(): void {
    getPostHog()?.capture('payment_completed')
  },

  categoryCreated(): void {
    getPostHog()?.capture('category_created')
  },

  creditCardAdded(): void {
    getPostHog()?.capture('credit_card_added')
  },

  referralLinkViewed(code: string): void {
    getPostHog()?.capture('referral_link_viewed', { code })
  },

  referralLinkCopied(): void {
    getPostHog()?.capture('referral_link_copied')
  },

  referralLinkShared(method: 'whatsapp' | 'native'): void {
    getPostHog()?.capture('referral_link_shared', { method })
  },

  referralClaimed(code: string): void {
    getPostHog()?.capture('referral_claimed', { code })
  },
}
