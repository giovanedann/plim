import * as Sentry from '@sentry/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './error-boundary'

vi.mock('@sentry/react')

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Child component</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('error catching', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Child component')).toBeInTheDocument()
      expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument()
    })

    it('catches errors thrown by child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Child component')).not.toBeInTheDocument()
      expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    })

    it('logs error to console when error is caught', () => {
      const consoleError = vi.spyOn(console, 'error')

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(consoleError).toHaveBeenCalled()
      expect(consoleError).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      )
    })
  })

  describe('fallback UI', () => {
    it('displays error heading', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('heading', { name: 'Algo deu errado' })).toBeInTheDocument()
    })

    it('displays error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(
        screen.getByText('Ocorreu um erro inesperado. Por favor, tente novamente.')
      ).toBeInTheDocument()
    })

    it('displays home navigation button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: 'Ir para o inicio' })).toBeInTheDocument()
    })

    it('displays logo icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('P')).toBeInTheDocument()
    })

    it('applies correct layout classes for centering', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const wrapper = container.querySelector('.flex.min-h-screen')
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass('items-center', 'justify-center')
    })
  })

  describe('reset functionality', () => {
    it('navigates to home when button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const homeButton = screen.getByRole('button', { name: 'Ir para o inicio' })
      await user.click(homeButton)

      // In test environment, window.location.href is set to the full URL
      expect(window.location.href).toMatch(/\/$/)
      expect(window.location.pathname).toBe('/')
    })
  })

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const heading = screen.getByRole('heading', { name: 'Algo deu errado' })
      expect(heading.tagName).toBe('H1')
    })

    it('button is keyboard accessible', async () => {
      const user = userEvent.setup()

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const homeButton = screen.getByRole('button', { name: 'Ir para o inicio' })

      // Tab to the button
      await user.tab()
      expect(homeButton).toHaveFocus()

      // Activate with keyboard
      await user.keyboard('{Enter}')
      expect(window.location.pathname).toBe('/')
    })

    it('error message is readable by screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const message = screen.getByText('Ocorreu um erro inesperado. Por favor, tente novamente.')
      expect(message).toBeInTheDocument()
      expect(message).toBeVisible()
    })
  })

  describe('edge cases', () => {
    it('handles errors with custom error messages', () => {
      function CustomError(): React.ReactNode {
        throw new Error('Custom error message')
      }

      render(
        <ErrorBoundary>
          <CustomError />
        </ErrorBoundary>
      )

      // Should still show generic fallback UI
      expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    })

    it('handles multiple child components', () => {
      render(
        <ErrorBoundary>
          <div>Component 1</div>
          <ThrowError shouldThrow={false} />
          <div>Component 3</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Component 1')).toBeInTheDocument()
      expect(screen.getByText('Child component')).toBeInTheDocument()
      expect(screen.getByText('Component 3')).toBeInTheDocument()
    })

    it('handles errors thrown in nested components', () => {
      function Wrapper() {
        return (
          <div>
            <ThrowError shouldThrow={true} />
          </div>
        )
      }

      render(
        <ErrorBoundary>
          <Wrapper />
        </ErrorBoundary>
      )

      expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    })

    it('handles null children gracefully', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>)

      expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument()
    })

    it('handles undefined children gracefully', () => {
      render(<ErrorBoundary>{undefined}</ErrorBoundary>)

      expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument()
    })
  })

  describe('error reporting', () => {
    it('includes error info in console error', () => {
      const consoleError = vi.spyOn(console, 'error')

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const errorCall = consoleError.mock.calls.find((call) =>
        call[0]?.includes('ErrorBoundary caught an error:')
      )
      expect(errorCall).toBeDefined()
      expect(errorCall?.[1]).toBeInstanceOf(Error)
      expect(errorCall?.[1]?.message).toBe('Test error')
      expect(errorCall?.[2]).toHaveProperty('componentStack')
    })

    it('preserves error stack trace', () => {
      const consoleError = vi.spyOn(console, 'error')

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const errorCall = consoleError.mock.calls.find((call) =>
        call[0]?.includes('ErrorBoundary caught an error:')
      )
      const error = errorCall?.[1] as Error
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('ThrowError')
    })
  })

  describe('sentry integration', () => {
    it('calls Sentry.captureException when an error is caught', () => {
      const sut = vi.mocked(Sentry.captureException)

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(sut).toHaveBeenCalledTimes(1)
    })

    it('passes the error object to Sentry.captureException', () => {
      const sut = vi.mocked(Sentry.captureException)

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const capturedError = sut.mock.calls[0][0] as Error
      expect(capturedError).toBeInstanceOf(Error)
      expect(capturedError.message).toBe('Test error')
    })

    it('includes component stack in the Sentry context', () => {
      const sut = vi.mocked(Sentry.captureException)

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const context = sut.mock.calls[0][1] as {
        contexts: { react: { componentStack: string } }
      }
      expect(context.contexts.react.componentStack).toBeDefined()
      expect(typeof context.contexts.react.componentStack).toBe('string')
    })

    it('does not call Sentry.captureException when no error occurs', () => {
      const sut = vi.mocked(Sentry.captureException)

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(sut).not.toHaveBeenCalled()
    })
  })
})
