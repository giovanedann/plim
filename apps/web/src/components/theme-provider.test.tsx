import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './theme-provider'

// Test component that uses the theme hook
function TestComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Light
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Dark
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        System
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  let user: ReturnType<typeof userEvent.setup>
  let mockLocalStorage: Record<string, string>
  let mockMatchMedia: { matches: boolean; addEventListener: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    user = userEvent.setup()
    mockLocalStorage = {}

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key]
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {}
        }),
      },
      writable: true,
    })

    // Mock matchMedia
    mockMatchMedia = {
      matches: false,
      addEventListener: vi.fn(),
    }
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => mockMatchMedia),
      writable: true,
    })

    // Mock document.documentElement
    document.documentElement.classList.remove('light', 'dark')
  })

  describe('initialization', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Test content</div>
        </ThemeProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('uses system theme by default', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
    })

    it('uses custom default theme when provided', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    it('loads theme from localStorage if available', () => {
      mockLocalStorage['theme'] = 'dark'

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    it('uses custom storage key when provided', () => {
      mockLocalStorage['custom-theme-key'] = 'light'

      render(
        <ThemeProvider storageKey="custom-theme-key">
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })
  })

  describe('theme switching', () => {
    it('switches to light theme', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByTestId('set-light'))

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })

    it('switches to dark theme', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByTestId('set-dark'))

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    it('switches to system theme', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByTestId('set-system'))

      expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
    })

    it('persists theme to localStorage when changed', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByTestId('set-dark'))

      expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('persists theme to custom storage key', async () => {
      render(
        <ThemeProvider storageKey="custom-key">
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByTestId('set-light'))

      expect(window.localStorage.setItem).toHaveBeenCalledWith('custom-key', 'light')
    })
  })

  describe('DOM class management', () => {
    it('adds light class to document when light theme active', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })
    })

    it('adds dark class to document when dark theme active', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('removes previous theme class when switching themes', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })

      await user.click(screen.getByTestId('set-light'))

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('applies light theme when system preference is light', async () => {
      mockMatchMedia.matches = false // light mode

      render(
        <ThemeProvider defaultTheme="system">
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })
    })

    it('applies dark theme when system preference is dark', async () => {
      mockMatchMedia.matches = true // dark mode

      render(
        <ThemeProvider defaultTheme="system">
          <TestComponent />
        </ThemeProvider>
      )

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })
  })

  describe('useTheme hook', () => {
    it('throws error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useTheme must be used within a ThemeProvider')

      consoleSpy.mockRestore()
    })

    it('provides theme and setTheme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toBeInTheDocument()
      expect(screen.getByTestId('set-light')).toBeInTheDocument()
      expect(screen.getByTestId('set-dark')).toBeInTheDocument()
      expect(screen.getByTestId('set-system')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles rapid theme switches', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByTestId('set-light'))
      await user.click(screen.getByTestId('set-dark'))
      await user.click(screen.getByTestId('set-system'))
      await user.click(screen.getByTestId('set-light'))

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })

    it('handles invalid theme in localStorage gracefully', () => {
      mockLocalStorage['theme'] = 'invalid-theme'

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should fall back to default theme
      expect(screen.getByTestId('current-theme')).toHaveTextContent('invalid-theme')
    })
  })
})
