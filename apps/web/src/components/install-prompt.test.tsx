import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InstallPrompt } from './install-prompt'

const mockPromptInstall = vi.fn()

vi.mock('@/hooks/use-install-prompt', () => ({
  useInstallPrompt: vi.fn(),
}))

const STORAGE_KEY = 'plim:install-prompt-dismissed'

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
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('visibility conditions', () => {
    it('does not render when already installed', () => {
      mockHook({ isInstalled: true, canPrompt: true })

      render(<InstallPrompt />)

      expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()
    })

    it('does not render when canPrompt is false and isIOS is false', () => {
      mockHook({ canPrompt: false, isIOS: false })

      render(<InstallPrompt />)

      expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()
    })

    it('renders immediately when canPrompt is true', () => {
      mockHook({ canPrompt: true })

      render(<InstallPrompt />)

      expect(screen.getByText('Instalar o Plim')).toBeInTheDocument()
    })

    it('renders immediately when isIOS is true', () => {
      mockHook({ isIOS: true })

      render(<InstallPrompt />)

      expect(screen.getByText('Instalar o Plim')).toBeInTheDocument()
    })

    it('does not render when dismissed', () => {
      localStorage.setItem(STORAGE_KEY, 'true')
      mockHook({ canPrompt: true })

      render(<InstallPrompt />)

      expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()
    })
  })

  describe('non-iOS install banner', () => {
    it('shows install button', () => {
      mockHook({ canPrompt: true, isIOS: false })

      render(<InstallPrompt />)

      expect(screen.getByText('Instalar o Plim')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Instalar' })).toBeInTheDocument()
    })

    it('calls promptInstall() when install button is clicked', async () => {
      mockHook({ canPrompt: true, isIOS: false })
      const user = userEvent.setup()

      render(<InstallPrompt />)

      await user.click(screen.getByRole('button', { name: 'Instalar' }))

      expect(mockPromptInstall).toHaveBeenCalledTimes(1)
    })
  })

  describe('iOS instructions overlay', () => {
    it('shows iOS instructions when isIOS is true and install is clicked', async () => {
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
    it('persists dismissal to localStorage', async () => {
      mockHook({ canPrompt: true })
      const user = userEvent.setup()

      render(<InstallPrompt />)

      await user.click(screen.getByRole('button', { name: 'Fechar' }))

      expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
    })

    it('hides banner after dismissal', async () => {
      mockHook({ canPrompt: true })
      const user = userEvent.setup()

      render(<InstallPrompt />)

      expect(screen.getByText('Instalar o Plim')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Fechar' }))

      await waitFor(() => {
        expect(screen.queryByText('Instalar o Plim')).not.toBeInTheDocument()
      })
    })
  })
})
