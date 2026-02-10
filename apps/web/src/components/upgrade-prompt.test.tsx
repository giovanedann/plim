import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from './theme-provider'
import { UpgradePrompt } from './upgrade-prompt'

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ to, children, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }
})

// Mock Progress component to simplify testing
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" data-value={value} className={className} />
  ),
}))

describe('UpgradePrompt', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>)
  }

  describe('usage counter', () => {
    it('shows usage counter with correct text', () => {
      renderWithTheme(
        <UpgradePrompt
          current={3}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('3/5 categorias usadas')).toBeInTheDocument()
    })

    it('handles zero usage', () => {
      renderWithTheme(
        <UpgradePrompt
          current={0}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('0/5 categorias usadas')).toBeInTheDocument()
    })

    it('shows correct count when at limit', () => {
      renderWithTheme(
        <UpgradePrompt
          current={5}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('5/5 categorias usadas')).toBeInTheDocument()
    })

    it('shows correct count above limit', () => {
      renderWithTheme(
        <UpgradePrompt
          current={6}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('6/5 categorias usadas')).toBeInTheDocument()
    })
  })

  describe('progress bar', () => {
    it('shows progress bar at correct percentage', () => {
      renderWithTheme(
        <UpgradePrompt
          current={3}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '60')
    })

    it('shows 0% progress when current is 0', () => {
      renderWithTheme(
        <UpgradePrompt
          current={0}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '0')
    })

    it('shows 100% progress when at limit', () => {
      renderWithTheme(
        <UpgradePrompt
          current={5}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '100')
    })

    it('shows >100% progress when over limit', () => {
      renderWithTheme(
        <UpgradePrompt
          current={6}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '120')
    })

    it('handles fractional percentages by rounding', () => {
      renderWithTheme(
        <UpgradePrompt
          current={1}
          limit={3}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      const progressBar = screen.getByTestId('progress-bar')
      // 1/3 = 33.333... -> Math.round = 33
      expect(progressBar).toHaveAttribute('data-value', '33')
    })
  })

  describe('limit message and upgrade CTA', () => {
    it('shows limit message when at limit', () => {
      renderWithTheme(
        <UpgradePrompt
          current={5}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite de categorias."
        />
      )

      expect(screen.getByText(/Você atingiu o limite de categorias./)).toBeInTheDocument()
      expect(screen.getByText('Vire Pro')).toBeInTheDocument()
    })

    it('shows limit message when over limit', () => {
      renderWithTheme(
        <UpgradePrompt
          current={6}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite de categorias."
        />
      )

      expect(screen.getByText(/Você atingiu o limite de categorias./)).toBeInTheDocument()
      expect(screen.getByText('Vire Pro')).toBeInTheDocument()
    })

    it('does not show limit message when under limit', () => {
      renderWithTheme(
        <UpgradePrompt
          current={2}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite de categorias."
        />
      )

      expect(screen.queryByText(/Você atingiu o limite de categorias./)).not.toBeInTheDocument()
      expect(screen.queryByText('Vire Pro')).not.toBeInTheDocument()
    })

    it('upgrade CTA links to upgrade page', () => {
      renderWithTheme(
        <UpgradePrompt
          current={5}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite de categorias."
        />
      )

      const upgradeLink = screen.getByText('Vire Pro').closest('a')
      expect(upgradeLink).toHaveAttribute('href', '/upgrade')
    })
  })

  describe('"Seja Pro" link', () => {
    it('shows "Seja Pro" link always', () => {
      renderWithTheme(
        <UpgradePrompt
          current={2}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('Seja Pro')).toBeInTheDocument()
    })

    it('shows "Seja Pro" link even when under limit', () => {
      renderWithTheme(
        <UpgradePrompt
          current={0}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('Seja Pro')).toBeInTheDocument()
    })

    it('shows "Seja Pro" link when at limit', () => {
      renderWithTheme(
        <UpgradePrompt
          current={5}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('Seja Pro')).toBeInTheDocument()
    })

    it('"Seja Pro" link points to upgrade page', () => {
      renderWithTheme(
        <UpgradePrompt
          current={2}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      const sejaProLink = screen.getByText('Seja Pro').closest('a')
      expect(sejaProLink).toHaveAttribute('href', '/upgrade')
    })

    it('displays Crown icon in "Seja Pro" link', () => {
      renderWithTheme(
        <UpgradePrompt
          current={2}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      const sejaProLink = screen.getByText('Seja Pro').closest('a')
      const crownIcon = sejaProLink?.querySelector('svg')
      expect(crownIcon).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('renders links as accessible anchor elements', () => {
      renderWithTheme(
        <UpgradePrompt
          current={5}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite."
        />
      )

      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2) // "Seja Pro" and "Vire Pro"
    })

    it('limit message includes accessible upgrade link', () => {
      renderWithTheme(
        <UpgradePrompt
          current={5}
          limit={5}
          featureLabel="categorias"
          limitMessage="Você atingiu o limite de categorias."
        />
      )

      const upgradeLink = screen.getByRole('link', { name: 'Vire Pro' })
      expect(upgradeLink).toBeInTheDocument()
      expect(upgradeLink).toHaveAttribute('href', '/upgrade')
    })
  })

  describe('different feature labels', () => {
    it('works with "despesas" feature label', () => {
      renderWithTheme(
        <UpgradePrompt
          current={15}
          limit={20}
          featureLabel="despesas"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('15/20 despesas usadas')).toBeInTheDocument()
    })

    it('works with "cartões" feature label', () => {
      renderWithTheme(
        <UpgradePrompt
          current={2}
          limit={3}
          featureLabel="cartões"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('2/3 cartões usadas')).toBeInTheDocument()
    })

    it('works with custom feature label', () => {
      renderWithTheme(
        <UpgradePrompt
          current={1}
          limit={1}
          featureLabel="consultas"
          limitMessage="Você atingiu o limite."
        />
      )

      expect(screen.getByText('1/1 consultas usadas')).toBeInTheDocument()
    })
  })
})
