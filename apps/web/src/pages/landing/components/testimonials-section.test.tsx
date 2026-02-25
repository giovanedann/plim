import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TestimonialsSection } from './testimonials-section'

describe('TestimonialsSection', () => {
  it('renders the section heading', () => {
    render(<TestimonialsSection />)

    expect(screen.getByText('Depoimentos')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Quem usa, recomenda' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Veja o que pessoas reais estão falando sobre o Plim.')
    ).toBeInTheDocument()
  })

  it('renders all testimonial cards with names and quotes (duplicated for marquee)', () => {
    render(<TestimonialsSection />)

    const expectedNames = ['Nathan R.', 'Lauane O.', 'Kaique M.', 'Rodrigo R.']

    for (const name of expectedNames) {
      const matches = screen.getAllByText(name)
      expect(matches.length).toBe(2)
    }

    expect(screen.getAllByText(/Gostei muito da plataforma/)).toHaveLength(2)
    expect(screen.getAllByText(/O Plim chegou no momento certo/)).toHaveLength(2)
    expect(screen.getAllByText(/O aplicativo é muito intuitivo/)).toHaveLength(2)
    expect(screen.getAllByText(/O Plim é perfeito para a correria/)).toHaveLength(2)
  })

  it('renders correct star ratings', () => {
    render(<TestimonialsSection />)

    const starRatings = screen.getAllByRole('img')

    // 4 testimonials × 2 (duplicated for marquee) = 8
    expect(starRatings).toHaveLength(8)
    expect(
      starRatings.filter((el) => el.getAttribute('aria-label') === '5 de 5 estrelas')
    ).toHaveLength(8)
  })

  it('wraps quotes in quotation marks', () => {
    render(<TestimonialsSection />)

    const quoteElements = screen.getAllByText(/\u201C.*\u201D/)

    expect(quoteElements.length).toBeGreaterThan(0)
  })
})
