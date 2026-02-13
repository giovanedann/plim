import { type AnalyticsConsent, useConsentStore } from '@/stores/consent.store'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsentBanner } from './consent-banner'

vi.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

describe('ConsentBanner', () => {
  const initialState = {
    analyticsConsent: 'pending' as AnalyticsConsent,
    hasResponded: false,
  }

  beforeEach(() => {
    useConsentStore.setState(initialState)
  })

  describe('rendering', () => {
    it('renders when consent is pending', () => {
      render(<ConsentBanner />)

      expect(screen.getByText(/usamos ferramentas de análise/i)).toBeInTheDocument()
    })

    it('renders accept and deny buttons', () => {
      render(<ConsentBanner />)

      expect(screen.getByRole('button', { name: 'Aceitar' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Recusar' })).toBeInTheDocument()
    })

    it('renders privacy policy link', () => {
      render(<ConsentBanner />)

      const link = screen.getByRole('link', { name: 'Saiba mais' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/privacy')
    })

    it('does not render when consent is granted', () => {
      useConsentStore.setState({ analyticsConsent: 'granted', hasResponded: true })

      render(<ConsentBanner />)

      expect(screen.queryByText(/usamos ferramentas de análise/i)).not.toBeInTheDocument()
    })

    it('does not render when consent is denied', () => {
      useConsentStore.setState({ analyticsConsent: 'denied', hasResponded: true })

      render(<ConsentBanner />)

      expect(screen.queryByText(/usamos ferramentas de análise/i)).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('sets consent to granted when Aceitar is clicked', async () => {
      const user = userEvent.setup()
      render(<ConsentBanner />)

      await user.click(screen.getByRole('button', { name: 'Aceitar' }))

      expect(useConsentStore.getState().analyticsConsent).toBe('granted')
      expect(useConsentStore.getState().hasResponded).toBe(true)
    })

    it('sets consent to denied when Recusar is clicked', async () => {
      const user = userEvent.setup()
      render(<ConsentBanner />)

      await user.click(screen.getByRole('button', { name: 'Recusar' }))

      expect(useConsentStore.getState().analyticsConsent).toBe('denied')
      expect(useConsentStore.getState().hasResponded).toBe(true)
    })
  })
})
