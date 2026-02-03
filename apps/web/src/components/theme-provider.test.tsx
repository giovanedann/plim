import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './theme-provider'

// Test component that uses the theme hook
function TestComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <div aria-label="Current theme">{theme}</div>
      <button type="button" onClick={() => setTheme('light')}>
        Light
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        Dark
      </button>
      <button type="button" onClick={() => setTheme('system')}>
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
    vi.clearAllMocks()
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('uses system theme by default', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByLabelText('Current theme')).toHaveTextContent('system')
    })

    it('uses custom default theme when provided', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByLabelText('Current theme')).toHaveTextContent('dark')
    })

    it('loads theme from localStorage if available', () => {
      mockLocalStorage.theme = 'dark'

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByLabelText('Current theme')).toHaveTextContent('dark')
    })

    it('uses custom storage key when provided', () => {
      mockLocalStorage['custom-theme-key'] = 'light'

      render(
        <ThemeProvider storageKey="custom-theme-key">
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByLabelText('Current theme')).toHaveTextContent('light')
    })
  })

  describe('theme switching', () => {
    it('switches to light theme', async () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByRole('button', { name: 'Light' }))

      expect(screen.getByLabelText('Current theme')).toHaveTextContent('light')
    })

    it('switches to dark theme', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByRole('button', { name: 'Dark' }))

      expect(screen.getByLabelText('Current theme')).toHaveTextContent('dark')
    })

    it('switches to system theme', async () => {
      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByRole('button', { name: 'System' }))

      expect(screen.getByLabelText('Current theme')).toHaveTextContent('system')
    })

    it('persists theme to localStorage when changed', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByRole('button', { name: 'Dark' }))

      expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('persists theme to custom storage key', async () => {
      render(
        <ThemeProvider storageKey="custom-key">
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByRole('button', { name: 'Light' }))

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

      await user.click(screen.getByRole('button', { name: 'Light' }))

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
      vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useTheme must be used within a ThemeProvider')
    })

    it('provides theme and setTheme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByLabelText('Current theme')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'System' })).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles rapid theme switches', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await user.click(screen.getByRole('button', { name: 'Light' }))
      await user.click(screen.getByRole('button', { name: 'Dark' }))
      await user.click(screen.getByRole('button', { name: 'System' }))
      await user.click(screen.getByRole('button', { name: 'Light' }))

      expect(screen.getByLabelText('Current theme')).toHaveTextContent('light')
    })

    it('handles invalid theme in localStorage gracefully', () => {
      mockLocalStorage.theme = 'invalid-theme'

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should fall back to default theme
      expect(screen.getByLabelText('Current theme')).toHaveTextContent('invalid-theme')
    })
  })
})
