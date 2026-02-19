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

  it('renders all testimonial cards with names and quotes', () => {
    render(<TestimonialsSection />)

    const expectedNames = ['Nathan R.', 'Lauane O.', 'Kaique M.', 'Rodrigo R.']

    for (const name of expectedNames) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }

    expect(screen.getByText(/Gostei muito da plataforma/)).toBeInTheDocument()
    expect(screen.getByText(/O Plim chegou no momento certo/)).toBeInTheDocument()
    expect(screen.getByText(/O aplicativo é muito intuitivo/)).toBeInTheDocument()
    expect(screen.getByText(/O Plim é perfeito para a correria/)).toBeInTheDocument()
  })

  it('renders correct star ratings', () => {
    render(<TestimonialsSection />)

    const starRatings = screen.getAllByRole('img')

    expect(starRatings).toHaveLength(4)
    expect(
      starRatings.filter((el) => el.getAttribute('aria-label') === '5 de 5 estrelas')
    ).toHaveLength(4)
  })

  it('wraps quotes in quotation marks', () => {
    render(<TestimonialsSection />)

    const quoteElements = screen.getAllByText(/\u201C.*\u201D/)

    expect(quoteElements.length).toBeGreaterThan(0)
  })
})
