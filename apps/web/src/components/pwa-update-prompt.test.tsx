import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PWAUpdatePrompt } from './pwa-update-prompt'

const mockUpdateServiceWorker = vi.fn()
const mockRegistrationUpdate = vi.fn()
let mockNeedRefresh = false

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options?: { onRegisteredSW?: (swUrl: string, registration: any) => void }) => {
    if (options?.onRegisteredSW) {
      options.onRegisteredSW('/sw.js', { update: mockRegistrationUpdate })
    }
    return {
      needRefresh: [mockNeedRefresh, vi.fn()],
      updateServiceWorker: mockUpdateServiceWorker,
    }
  },
}))

describe('PWAUpdatePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNeedRefresh = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('visibility', () => {
    it('does not render anything when needRefresh is false', () => {
      mockNeedRefresh = false

      const { container } = render(<PWAUpdatePrompt />)

      expect(screen.queryByText('Nova versão disponível!')).not.toBeInTheDocument()
      expect(container.querySelector('.fixed')).not.toBeInTheDocument()
    })

    it('renders update card when needRefresh is true', () => {
      mockNeedRefresh = true

      render(<PWAUpdatePrompt />)

      expect(screen.getByText('Nova versão disponível!')).toBeInTheDocument()
    })
  })

  describe('update card content', () => {
    it('renders "Nova versão disponível!" text', () => {
      mockNeedRefresh = true

      render(<PWAUpdatePrompt />)

      expect(screen.getByText('Nova versão disponível!')).toBeInTheDocument()
    })

    it('renders "Atualizar" button', () => {
      mockNeedRefresh = true

      render(<PWAUpdatePrompt />)

      expect(screen.getByRole('button', { name: 'Atualizar' })).toBeInTheDocument()
    })
  })

  describe('update action', () => {
    it('calls updateServiceWorker(true) when "Atualizar" button is clicked', async () => {
      mockNeedRefresh = true
      const user = userEvent.setup()

      render(<PWAUpdatePrompt />)

      await user.click(screen.getByRole('button', { name: 'Atualizar' }))

      expect(mockUpdateServiceWorker).toHaveBeenCalledTimes(1)
      expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
    })
  })

  describe('positioning', () => {
    it('has fixed positioning with bottom-right placement above AI chat', () => {
      mockNeedRefresh = true

      const { container } = render(<PWAUpdatePrompt />)

      const fixedEl = container.querySelector('.fixed')
      expect(fixedEl).toBeInTheDocument()
      expect(fixedEl).toHaveClass('bottom-4', 'right-4', 'z-[60]')
    })
  })

  describe('service worker registration', () => {
    it('sets up SW update interval via onRegisteredSW callback', () => {
      vi.useFakeTimers()
      mockNeedRefresh = false

      render(<PWAUpdatePrompt />)

      expect(mockRegistrationUpdate).not.toHaveBeenCalled()

      const ONE_HOUR_MS = 60 * 60 * 1000
      vi.advanceTimersByTime(ONE_HOUR_MS)

      expect(mockRegistrationUpdate).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(ONE_HOUR_MS)

      expect(mockRegistrationUpdate).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })
})
