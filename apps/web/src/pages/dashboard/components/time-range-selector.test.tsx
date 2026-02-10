import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TimeRangeSelector } from './time-range-selector'

let mockIsPro = false

vi.mock('@/hooks/use-plan-limits', () => ({
  usePlanLimits: () => ({
    isPro: mockIsPro,
    isLoading: false,
  }),
}))

describe('TimeRangeSelector', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    mockIsPro = false
  })

  describe('free user (isPro: false)', () => {
    it('renders all three time range options', () => {
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      expect(screen.getByRole('tab', { name: /este mês/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /trimestre/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /ano/i })).toBeInTheDocument()
    })

    it('Trimestre tab is disabled for free user', () => {
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      expect(trimestreTab).toBeDisabled()
    })

    it('Ano tab is disabled for free user', () => {
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const anoTab = screen.getByRole('tab', { name: /ano/i })
      expect(anoTab).toBeDisabled()
    })

    it('Este mês tab is NOT disabled for free user', () => {
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const esteMesTab = screen.getByRole('tab', { name: /este mês/i })
      expect(esteMesTab).not.toBeDisabled()
    })

    it('does not call onChange when clicking locked Trimestre tab', async () => {
      const user = userEvent.setup()
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      await user.click(trimestreTab)

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('does not call onChange when clicking locked Ano tab', async () => {
      const user = userEvent.setup()
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const anoTab = screen.getByRole('tab', { name: /ano/i })
      await user.click(anoTab)

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('calls onChange when clicking Este mês tab', async () => {
      const user = userEvent.setup()
      render(<TimeRangeSelector value="quarter" onChange={mockOnChange} />)

      const esteMesTab = screen.getByRole('tab', { name: /este mês/i })
      await user.click(esteMesTab)

      expect(mockOnChange).toHaveBeenCalledWith('month')
    })

    it('shows tooltip on disabled Trimestre tab', async () => {
      const user = userEvent.setup()
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      await user.hover(trimestreTab)

      const tooltips = await screen.findAllByText(/vire pro e veja trimestre e ano completo/i)
      expect(tooltips.length).toBeGreaterThan(0)
    })

    it('shows lock icon on disabled tabs', () => {
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      const anoTab = screen.getByRole('tab', { name: /ano/i })

      expect(trimestreTab.querySelector('svg')).toBeInTheDocument()
      expect(anoTab.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('pro user (isPro: true)', () => {
    beforeEach(() => {
      mockIsPro = true
    })

    it('shows no disabled tabs for pro user', () => {
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const esteMesTab = screen.getByRole('tab', { name: /este mês/i })
      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      const anoTab = screen.getByRole('tab', { name: /ano/i })

      expect(esteMesTab).not.toBeDisabled()
      expect(trimestreTab).not.toBeDisabled()
      expect(anoTab).not.toBeDisabled()
    })

    it('allows selecting Trimestre for pro user', async () => {
      const user = userEvent.setup()
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      await user.click(trimestreTab)

      expect(mockOnChange).toHaveBeenCalledWith('quarter')
    })

    it('allows selecting Ano for pro user', async () => {
      const user = userEvent.setup()
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const anoTab = screen.getByRole('tab', { name: /ano/i })
      await user.click(anoTab)

      expect(mockOnChange).toHaveBeenCalledWith('year')
    })

    it('allows selecting Este mês for pro user', async () => {
      const user = userEvent.setup()
      render(<TimeRangeSelector value="quarter" onChange={mockOnChange} />)

      const esteMesTab = screen.getByRole('tab', { name: /este mês/i })
      await user.click(esteMesTab)

      expect(mockOnChange).toHaveBeenCalledWith('month')
    })

    it('does not show lock icons for pro user', () => {
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const esteMesTab = screen.getByRole('tab', { name: /este mês/i })
      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      const anoTab = screen.getByRole('tab', { name: /ano/i })

      expect(esteMesTab.querySelector('svg')).not.toBeInTheDocument()
      expect(trimestreTab.querySelector('svg')).not.toBeInTheDocument()
      expect(anoTab.querySelector('svg')).not.toBeInTheDocument()
    })
  })

  describe('controlled component behavior', () => {
    it('displays the correct selected value', () => {
      const { rerender } = render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      expect(screen.getByRole('tab', { name: /este mês/i })).toHaveAttribute('data-state', 'active')

      rerender(<TimeRangeSelector value="quarter" onChange={mockOnChange} />)
      expect(screen.getByRole('tab', { name: /trimestre/i })).toHaveAttribute(
        'data-state',
        'active'
      )

      rerender(<TimeRangeSelector value="year" onChange={mockOnChange} />)
      expect(screen.getByRole('tab', { name: /ano/i })).toHaveAttribute('data-state', 'active')
    })

    it('does not change selected value when onChange is not called', async () => {
      const user = userEvent.setup()
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      await user.click(trimestreTab)

      expect(screen.getByRole('tab', { name: /este mês/i })).toHaveAttribute('data-state', 'active')
    })
  })

  describe('accessibility', () => {
    it('disabled tabs are not clickable', () => {
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      const anoTab = screen.getByRole('tab', { name: /ano/i })

      expect(trimestreTab).toBeDisabled()
      expect(anoTab).toBeDisabled()
    })

    it('enabled tabs are clickable', () => {
      mockIsPro = true
      render(<TimeRangeSelector value="month" onChange={mockOnChange} />)

      const esteMesTab = screen.getByRole('tab', { name: /este mês/i })
      const trimestreTab = screen.getByRole('tab', { name: /trimestre/i })
      const anoTab = screen.getByRole('tab', { name: /ano/i })

      expect(esteMesTab).not.toBeDisabled()
      expect(trimestreTab).not.toBeDisabled()
      expect(anoTab).not.toBeDisabled()
    })
  })
})
