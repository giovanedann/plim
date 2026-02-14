import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Spotlight } from './spotlight'

vi.mock('@/hooks/use-reduced-motion', () => ({
  useReducedMotion: vi.fn(() => false),
}))

import { useReducedMotion } from '@/hooks/use-reduced-motion'

const mockRect = {
  top: 100,
  left: 200,
  width: 150,
  height: 50,
  right: 350,
  bottom: 150,
  x: 200,
  y: 100,
  toJSON: vi.fn(),
}

function createMockElement(tutorialId: string): HTMLDivElement {
  const element = document.createElement('div')
  element.setAttribute('data-tutorial-id', tutorialId)
  element.getBoundingClientRect = vi.fn(() => mockRect)
  document.body.appendChild(element)
  return element
}

describe('Spotlight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useReducedMotion).mockReturnValue(false)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders nothing when no target element', () => {
    const { container } = render(<Spotlight />)

    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when elementId is undefined', () => {
    const { container } = render(<Spotlight elementId={undefined} />)

    expect(container.innerHTML).toBe('')
  })

  it('renders overlay with cutout for target element', () => {
    createMockElement('test-element')

    render(<Spotlight elementId="test-element" />)

    const overlay = screen.getByTestId('spotlight-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay.style.clipPath).toContain('polygon')
  })

  it('positions cutout over target element', () => {
    createMockElement('test-element')

    render(<Spotlight elementId="test-element" padding={0} />)

    const overlay = screen.getByTestId('spotlight-overlay')
    const clipPath = overlay.style.clipPath

    expect(clipPath).toContain('200px 100px')
    expect(clipPath).toContain('350px 150px')
  })

  it('applies dark backdrop', () => {
    createMockElement('test-element')

    render(<Spotlight elementId="test-element" />)

    const overlay = screen.getByTestId('spotlight-overlay')
    expect(overlay.style.backgroundColor).toBe('rgba(0, 0, 0, 0.8)')
  })

  it('applies CSS transition class when moving between elements', () => {
    createMockElement('element-a')
    createMockElement('element-b')

    const { rerender } = render(<Spotlight elementId="element-a" />)

    rerender(<Spotlight elementId="element-b" />)

    const overlay = screen.getByTestId('spotlight-overlay')
    expect(overlay.style.transition).toContain('clip-path')
    expect(overlay.style.transition).toContain('cubic-bezier')
  })

  it('handles missing element gracefully', () => {
    const { container } = render(<Spotlight elementId="non-existent" />)

    expect(container.innerHTML).toBe('')
  })

  it('updates position on window resize', () => {
    const element = createMockElement('test-element')

    render(<Spotlight elementId="test-element" padding={0} />)

    const overlay = screen.getByTestId('spotlight-overlay')
    const initialClipPath = overlay.style.clipPath

    const updatedRect = {
      ...mockRect,
      top: 200,
      left: 300,
      right: 450,
      bottom: 250,
      x: 300,
      y: 200,
    }
    element.getBoundingClientRect = vi.fn(() => updatedRect)

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    const updatedClipPath = overlay.style.clipPath
    expect(updatedClipPath).not.toBe(initialClipPath)
    expect(updatedClipPath).toContain('300px 200px')
  })

  it('does not apply transition when reduced motion is preferred', () => {
    vi.mocked(useReducedMotion).mockReturnValue(true)

    createMockElement('element-a')
    createMockElement('element-b')

    const { rerender } = render(<Spotlight elementId="element-a" />)

    rerender(<Spotlight elementId="element-b" />)

    const overlay = screen.getByTestId('spotlight-overlay')
    expect(overlay.style.transition).toBe('')
  })

  it('applies custom padding to cutout', () => {
    createMockElement('test-element')

    render(<Spotlight elementId="test-element" padding={16} />)

    const overlay = screen.getByTestId('spotlight-overlay')
    const clipPath = overlay.style.clipPath

    expect(clipPath).toContain('184px 84px')
    expect(clipPath).toContain('366px 166px')
  })
})
