import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProChartLock } from './pro-chart-lock'

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

describe('ProChartLock', () => {
  describe('Content rendering', () => {
    it('renders the title', () => {
      render(<ProChartLock title="Gráfico de Categorias" />)

      expect(screen.getByText('Gráfico de Categorias')).toBeInTheDocument()
    })

    it('renders the subtitle "Disponível no plano Pro"', () => {
      render(<ProChartLock title="Gráfico de Categorias" />)

      expect(screen.getByText('Disponível no plano Pro')).toBeInTheDocument()
    })

    it('renders "Seja Pro" link that points to /upgrade', () => {
      render(<ProChartLock title="Gráfico de Categorias" />)

      const link = screen.getByRole('link', { name: /seja pro/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/upgrade')
    })
  })

  describe('Icon rendering', () => {
    it('renders Lock icon', () => {
      const { container } = render(<ProChartLock title="Gráfico de Categorias" />)

      // Lock icon is rendered as an svg with specific class
      const lockIcon = container.querySelector('svg.lucide-lock')
      expect(lockIcon).toBeInTheDocument()
    })

    it('renders Crown icon in the upgrade button', () => {
      const { container } = render(<ProChartLock title="Gráfico de Categorias" />)

      // Crown icon is rendered as an svg with specific class
      const crownIcon = container.querySelector('svg.lucide-crown')
      expect(crownIcon).toBeInTheDocument()
    })
  })

  describe('Children rendering', () => {
    it('renders children when provided with blur overlay', () => {
      render(
        <ProChartLock title="Gráfico de Categorias">
          <div data-testid="chart-content">Chart content here</div>
        </ProChartLock>
      )

      const childContent = screen.getByTestId('chart-content')
      expect(childContent).toBeInTheDocument()
      expect(screen.getByText('Chart content here')).toBeInTheDocument()

      // Verify blur overlay classes are applied
      const blurContainer = childContent.parentElement
      expect(blurContainer).toHaveClass(
        'pointer-events-none',
        'select-none',
        'blur-[6px]',
        'opacity-50'
      )
    })

    it('does not render children container when no children provided', () => {
      const { container } = render(<ProChartLock title="Gráfico de Categorias" />)

      // The blur container should not exist when no children are provided
      const blurContainer = container.querySelector('.blur-\\[6px\\]')
      expect(blurContainer).not.toBeInTheDocument()
    })

    it('renders multiple children when provided', () => {
      render(
        <ProChartLock title="Gráfico de Categorias">
          <div data-testid="chart-1">Chart 1</div>
          <div data-testid="chart-2">Chart 2</div>
        </ProChartLock>
      )

      expect(screen.getByTestId('chart-1')).toBeInTheDocument()
      expect(screen.getByTestId('chart-2')).toBeInTheDocument()
    })
  })

  describe('Visual structure', () => {
    it('applies correct container classes', () => {
      const { container } = render(<ProChartLock title="Gráfico de Categorias" />)

      const mainContainer = container.querySelector('.relative.overflow-hidden.rounded-xl.border')
      expect(mainContainer).toBeInTheDocument()
    })

    it('renders overlay with backdrop blur', () => {
      const { container } = render(<ProChartLock title="Gráfico de Categorias" />)

      const overlay = container.querySelector('.absolute.inset-0')
      expect(overlay).toHaveClass('bg-background/60', 'backdrop-blur-[2px]')
    })

    it('renders lock icon container with correct styling', () => {
      const { container } = render(<ProChartLock title="Gráfico de Categorias" />)

      const iconContainer = container.querySelector('.size-10.rounded-full.bg-amber-500\\/15')
      expect(iconContainer).toBeInTheDocument()
    })
  })
})
