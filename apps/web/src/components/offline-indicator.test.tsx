import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineIndicator } from './offline-indicator'

const mockUseOnlineStatus = vi.fn()

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}))

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render banner when online', () => {
    mockUseOnlineStatus.mockReturnValue(true)

    render(<OfflineIndicator />)

    expect(screen.queryByText('Você está offline. Exibindo dados salvos.')).not.toBeInTheDocument()
  })

  it('renders banner with offline message when offline', () => {
    mockUseOnlineStatus.mockReturnValue(false)

    render(<OfflineIndicator />)

    expect(screen.getByText('Você está offline. Exibindo dados salvos.')).toBeInTheDocument()
  })

  it('renders WifiOff icon when offline', () => {
    mockUseOnlineStatus.mockReturnValue(false)

    render(<OfflineIndicator />)

    const icon = screen
      .getByText('Você está offline. Exibindo dados salvos.')
      .closest('output')
      ?.querySelector('svg')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('has aria-live="assertive" for accessibility', () => {
    mockUseOnlineStatus.mockReturnValue(false)

    render(<OfflineIndicator />)

    const banner = screen.getByText('Você está offline. Exibindo dados salvos.').closest('output')
    expect(banner).toHaveAttribute('aria-live', 'assertive')
  })

  it('banner appears when status changes from online to offline', () => {
    mockUseOnlineStatus.mockReturnValue(true)

    const { rerender } = render(<OfflineIndicator />)

    expect(screen.queryByText('Você está offline. Exibindo dados salvos.')).not.toBeInTheDocument()

    mockUseOnlineStatus.mockReturnValue(false)
    rerender(<OfflineIndicator />)

    expect(screen.getByText('Você está offline. Exibindo dados salvos.')).toBeInTheDocument()
  })

  it('banner disappears when status changes from offline to online', async () => {
    mockUseOnlineStatus.mockReturnValue(false)

    const { rerender } = render(<OfflineIndicator />)

    expect(screen.getByText('Você está offline. Exibindo dados salvos.')).toBeInTheDocument()

    mockUseOnlineStatus.mockReturnValue(true)
    rerender(<OfflineIndicator />)

    await waitFor(() => {
      expect(
        screen.queryByText('Você está offline. Exibindo dados salvos.')
      ).not.toBeInTheDocument()
    })
  })
})
