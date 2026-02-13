import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InstallPrompt } from './install-prompt'

const mockPromptInstall = vi.fn()

vi.mock('@/hooks/use-install-prompt', () => ({
  useInstallPrompt: vi.fn(),
}))

const STORAGE_KEY = 'plim:install-prompt-dismissed'
const SESSION_KEY = 'plim:page-views'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000
const PAGE_VIEW_THRESHOLD = 2
const DELAY_MS = 5_000

function mockHook(overrides: Partial<ReturnType<typeof useInstallPrompt>> = {}): void {
  ;(useInstallPrompt as Mock).mockReturnValue({
    canPrompt: false,
    isInstalled: false,
    isIOS: false,
    promptInstall: mockPromptInstall,
    ...overrides,
  })
}

describe('InstallPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('visibility conditions', () => {
    it('does not render when already installed', () => {
      mockHook({ isInstalled: true, canPrompt: true })

      render(<InstallPrompt />)

      expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()
    })

    it('does not render when canPrompt is false and isIOS is false', () => {
      vi.useFakeTimers()
      mockHook({ canPrompt: false, isIOS: false })

      render(<InstallPrompt />)

      vi.advanceTimersByTime(DELAY_MS + 1000)

      expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()
    })

    it('does not render before PAGE_VIEW_THRESHOLD reached and before DELAY_MS', () => {
      vi.useFakeTimers()
      sessionStorage.setItem(SESSION_KEY, '0')
      mockHook({ canPrompt: true })

      render(<InstallPrompt />)

      expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()

      vi.advanceTimersByTime(DELAY_MS - 1)

      expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()
    })

    it('renders after PAGE_VIEW_THRESHOLD page views reached', () => {
      sessionStorage.setItem(SESSION_KEY, String(PAGE_VIEW_THRESHOLD - 1))
      mockHook({ canPrompt: true })

      render(<InstallPrompt />)

      expect(screen.getByText('Instalar o Plim')).toBeInTheDocument()
    })

    it('renders after DELAY_MS timeout', () => {
      vi.useFakeTimers()
      sessionStorage.setItem(SESSION_KEY, '0')
      mockHook({ canPrompt: true })

      render(<InstallPrompt />)

      expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(DELAY_MS)
      })

      expect(screen.getByText('Instalar o Plim')).toBeInTheDocument()
    })
  })

  describe('non-iOS install banner', () => {
    it('shows "Instalar o Plim" text with install button', () => {
      sessionStorage.setItem(SESSION_KEY, String(PAGE_VIEW_THRESHOLD - 1))
      mockHook({ canPrompt: true, isIOS: false })

      render(<InstallPrompt />)

      expect(screen.getByText('Instalar o Plim')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Instalar' })).toBeInTheDocument()
    })

    it('calls promptInstall() when install button is clicked', async () => {
      sessionStorage.setItem(SESSION_KEY, String(PAGE_VIEW_THRESHOLD - 1))
      mockHook({ canPrompt: true, isIOS: false })
      const user = userEvent.setup()

      render(<InstallPrompt />)

      await user.click(screen.getByRole('button', { name: 'Instalar' }))

      expect(mockPromptInstall).toHaveBeenCalledTimes(1)
    })
  })

  describe('iOS instructions overlay', () => {
    it('shows iOS instructions overlay when isIOS is true and install is clicked', async () => {
      sessionStorage.setItem(SESSION_KEY, String(PAGE_VIEW_THRESHOLD - 1))
      mockHook({ canPrompt: false, isIOS: true })
      const user = userEvent.setup()

      render(<InstallPrompt />)

      await user.click(screen.getByRole('button', { name: 'Instalar' }))

      expect(screen.getByText('Para instalar o Plim no seu iPhone ou iPad:')).toBeInTheDocument()
      expect(screen.getByText(/Compartilhar/)).toBeInTheDocument()
      expect(screen.getByText(/Adicionar a Tela de Inicio/)).toBeInTheDocument()
    })
  })

  describe('dismiss behavior', () => {
    it('dismissing stores timestamp in localStorage', async () => {
      sessionStorage.setItem(SESSION_KEY, String(PAGE_VIEW_THRESHOLD - 1))
      mockHook({ canPrompt: true })
      const user = userEvent.setup()

      render(<InstallPrompt />)

      expect(screen.getByText('Instalar o Plim')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Fechar' }))

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored).not.toBeNull()
      expect(Number(stored)).toBeGreaterThan(0)
    })

    it('does not show when dismissed less than 7 days ago', () => {
      const recentDismiss = Date.now() - (DISMISS_DURATION_MS - 1000)
      localStorage.setItem(STORAGE_KEY, String(recentDismiss))
      sessionStorage.setItem(SESSION_KEY, String(PAGE_VIEW_THRESHOLD - 1))
      mockHook({ canPrompt: true })

      render(<InstallPrompt />)

      expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()
    })

    it('re-shows after 7 days since dismissal', () => {
      const oldDismiss = Date.now() - (DISMISS_DURATION_MS + 1000)
      localStorage.setItem(STORAGE_KEY, String(oldDismiss))
      sessionStorage.setItem(SESSION_KEY, String(PAGE_VIEW_THRESHOLD - 1))
      mockHook({ canPrompt: true })

      render(<InstallPrompt />)

      expect(screen.getByText('Instalar o Plim')).toBeInTheDocument()
    })
  })

  describe('page view tracking', () => {
    it('increments page view count in sessionStorage', () => {
      sessionStorage.setItem(SESSION_KEY, '1')
      mockHook({ canPrompt: true })

      render(<InstallPrompt />)

      expect(sessionStorage.getItem(SESSION_KEY)).toBe('2')
    })
  })
})
