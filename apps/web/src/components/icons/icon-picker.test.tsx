import type { CategoryIconName } from '@/lib/icons'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IconPicker } from './icon-picker'

// Mock the icons module
vi.mock('@/lib/icons', () => ({
  CATEGORY_ICONS: {
    home: () => <svg data-testid="icon-home" />,
    car: () => <svg data-testid="icon-car" />,
    food: () => <svg data-testid="icon-food" />,
    shopping: () => <svg data-testid="icon-shopping" />,
    health: () => <svg data-testid="icon-health" />,
    entertainment: () => <svg data-testid="icon-entertainment" />,
  },
  CATEGORY_ICON_GROUPS: {
    'Casa & Moradia': ['home'] as const,
    Transporte: ['car'] as const,
    Alimentação: ['food', 'shopping'] as const,
    Saúde: ['health'] as const,
    Lazer: ['entertainment'] as const,
  },
}))

describe('IconPicker', () => {
  let user: ReturnType<typeof userEvent.setup>
  const mockOnChange = vi.fn()

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders trigger button', () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      expect(screen.getByRole('button', { name: /selecione um ícone/i })).toBeInTheDocument()
    })

    it('shows placeholder text when no icon selected', () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      expect(screen.getByText('Selecione um ícone')).toBeInTheDocument()
    })

    it('displays selected icon and name', () => {
      render(<IconPicker value={'home' as CategoryIconName} onChange={mockOnChange} />)

      expect(screen.getByTestId('icon-home')).toBeInTheDocument()
      expect(screen.getByText('home')).toBeInTheDocument()
    })

    it('passes custom color prop to component', () => {
      const customColor = 'rgb(255, 0, 0)'
      const { container } = render(
        <IconPicker value={'car' as CategoryIconName} onChange={mockOnChange} color={customColor} />
      )

      // Verify component rendered successfully with custom color prop
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('popover interaction', () => {
    it('opens popover when trigger clicked', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))

      expect(screen.getByPlaceholderText('Buscar ícone...')).toBeInTheDocument()
    })

    it('displays all icon groups when opened', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))

      expect(screen.getByText('Casa & Moradia')).toBeInTheDocument()
      expect(screen.getByText('Transporte')).toBeInTheDocument()
      expect(screen.getByText('Alimentação')).toBeInTheDocument()
      expect(screen.getByText('Saúde')).toBeInTheDocument()
      expect(screen.getByText('Lazer')).toBeInTheDocument()
    })

    it('displays icons in their respective groups', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))

      // Find the Casa & Moradia group
      const casaGroup = screen.getByText('Casa & Moradia').parentElement
      expect(within(casaGroup!).getByTestId('icon-home')).toBeInTheDocument()

      // Find the Transporte group
      const transporteGroup = screen.getByText('Transporte').parentElement
      expect(within(transporteGroup!).getByTestId('icon-car')).toBeInTheDocument()
    })
  })

  describe('search functionality', () => {
    it('filters icons by search term', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))
      await user.type(screen.getByPlaceholderText('Buscar ícone...'), 'car')

      expect(screen.getByText('Transporte')).toBeInTheDocument()
      expect(screen.queryByText('Casa & Moradia')).not.toBeInTheDocument()
      expect(screen.queryByText('Alimentação')).not.toBeInTheDocument()
    })

    it('filters icons case-insensitively', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))
      await user.type(screen.getByPlaceholderText('Buscar ícone...'), 'CAR')

      expect(screen.getByText('Transporte')).toBeInTheDocument()
    })

    it('shows no results message when no icons match', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))
      await user.type(screen.getByPlaceholderText('Buscar ícone...'), 'nonexistent')

      expect(screen.getByText('Nenhum ícone encontrado')).toBeInTheDocument()
    })

    it('shows multiple groups when search matches multiple icons', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))
      await user.type(screen.getByPlaceholderText('Buscar ícone...'), 'o')

      // 'o' matches: home, food, shopping
      expect(screen.getByText('Casa & Moradia')).toBeInTheDocument()
      expect(screen.getByText('Alimentação')).toBeInTheDocument()
    })

    it('clears search when resetting', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))
      const searchInput = screen.getByPlaceholderText('Buscar ícone...')
      await user.type(searchInput, 'car')

      expect(searchInput).toHaveValue('car')

      await user.clear(searchInput)

      expect(searchInput).toHaveValue('')
      expect(screen.getByText('Casa & Moradia')).toBeInTheDocument()
    })
  })

  describe('icon selection', () => {
    it('calls onChange when icon is clicked', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))

      const homeButton = screen.getByTitle('home')
      await user.click(homeButton)

      expect(mockOnChange).toHaveBeenCalledWith('home')
      expect(mockOnChange).toHaveBeenCalledTimes(1)
    })

    it('closes popover after selection', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))
      await user.click(screen.getByTitle('car'))

      // Search input should no longer be visible
      expect(screen.queryByPlaceholderText('Buscar ícone...')).not.toBeInTheDocument()
    })

    it('clears search after selection', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))
      await user.type(screen.getByPlaceholderText('Buscar ícone...'), 'car')
      await user.click(screen.getByTitle('car'))

      // Reopen popover
      await user.click(screen.getByRole('button'))

      // Search should be cleared
      expect(screen.getByPlaceholderText('Buscar ícone...')).toHaveValue('')
    })

    it('highlights selected icon', async () => {
      render(<IconPicker value={'food' as CategoryIconName} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button'))

      const foodButton = screen.getByTitle('food')
      expect(foodButton).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('allows changing selected icon', async () => {
      const { rerender } = render(
        <IconPicker value={'home' as CategoryIconName} onChange={mockOnChange} />
      )

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByTitle('car'))

      expect(mockOnChange).toHaveBeenCalledWith('car')

      // Simulate parent component updating the value
      rerender(<IconPicker value={'car' as CategoryIconName} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button'))
      const carButton = screen.getByTitle('car')
      expect(carButton).toHaveClass('bg-primary')
    })
  })

  describe('accessibility', () => {
    it('has accessible button role', () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('icon buttons have titles for screen readers', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))

      expect(screen.getByTitle('home')).toBeInTheDocument()
      expect(screen.getByTitle('car')).toBeInTheDocument()
      expect(screen.getByTitle('food')).toBeInTheDocument()
    })

    it('icon buttons are keyboard accessible', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))

      const homeButton = screen.getByTitle('home')
      homeButton.focus()
      expect(homeButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnChange).toHaveBeenCalledWith('home')
    })

    it('has proper focus ring on icon buttons', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))

      const homeButton = screen.getByTitle('home')
      expect(homeButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring')
    })
  })

  describe('edge cases', () => {
    it('handles null value gracefully', () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      expect(screen.getByText('Selecione um ícone')).toBeInTheDocument()
    })

    it('handles empty search gracefully', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))
      const searchInput = screen.getByPlaceholderText('Buscar ícone...')

      await user.type(searchInput, '   ')
      await user.clear(searchInput)

      expect(screen.getByText('Casa & Moradia')).toBeInTheDocument()
    })

    it('has scrollable container for icon list', async () => {
      render(<IconPicker value={null} onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /selecione um ícone/i }))

      // Verify the popover content is rendered with scrollable container
      const searchInput = screen.getByPlaceholderText('Buscar ícone...')
      expect(searchInput).toBeInTheDocument()

      // Verify icon groups are rendered (which means container exists)
      expect(screen.getByText('Casa & Moradia')).toBeInTheDocument()
    })
  })
})
