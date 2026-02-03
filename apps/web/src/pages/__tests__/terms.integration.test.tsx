import { ThemeProvider } from '@/components/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TermsPage } from '../legal/terms.page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useRouter: () => ({ state: { location: { pathname: '/terms' } } }),
}))

function TestWrapper({ children }: { children: React.ReactNode }) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}

describe('TermsPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('renders page heading', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByRole('heading', { name: 'Termos de Uso', level: 1 })).toBeInTheDocument()
    })

    it('shows last updated date', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Última atualização: 27 de janeiro de 2026/i)).toBeInTheDocument()
    })
  })

  describe('main sections', () => {
    it('renders acceptance of terms section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/1. Aceitação dos Termos/i)).toBeInTheDocument()
    })

    it('renders service description section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/2. Descrição do Serviço/i)).toBeInTheDocument()
    })

    it('renders user account section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/3. Conta de Usuário/i)).toBeInTheDocument()
    })

    it('renders acceptable use section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/4. Uso Aceitável/i)).toBeInTheDocument()
    })

    it('renders user content section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/5. Conteúdo do Usuário/i)).toBeInTheDocument()
    })

    it('renders intellectual property section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/6. Propriedade Intelectual/i)).toBeInTheDocument()
    })

    it('renders warranty disclaimer section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/7. Isenção de Garantias/i)).toBeInTheDocument()
    })

    it('renders liability limitation section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/8. Limitação de Responsabilidade/i)).toBeInTheDocument()
    })

    it('renders service modifications section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/9. Modificações do Serviço/i)).toBeInTheDocument()
    })

    it('renders termination section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/10. Rescisão/i)).toBeInTheDocument()
    })

    it('renders general provisions section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/11. Disposições Gerais/i)).toBeInTheDocument()
    })

    it('renders contact section', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/12. Contato/i)).toBeInTheDocument()
    })
  })

  describe('service description content', () => {
    it('describes Plim as personal finance management tool', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/gestão financeira pessoal/i)).toBeInTheDocument()
    })

    it('lists key features', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Registrar e categorizar despesas/i)).toBeInTheDocument()
      expect(screen.getByText(/Acompanhar salários e rendimentos/i)).toBeInTheDocument()
      expect(screen.getByText(/Gerenciar cartões de crédito e seus limites/i)).toBeInTheDocument()
    })

    it('clarifies what services are not offered', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Aconselhamento financeiro ou de investimentos/i)).toBeInTheDocument()
      expect(screen.getByText(/Serviços bancários ou de pagamento/i)).toBeInTheDocument()
    })
  })

  describe('contact information', () => {
    it('displays support email', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      const emailLink = screen.getByRole('link', { name: /suporte@plim.app.br/i })
      expect(emailLink).toHaveAttribute('href', 'mailto:suporte@plim.app.br')
    })

    it('shows thank you message', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Agradecemos por usar o Plim!/i)).toBeInTheDocument()
    })
  })

  describe('legal provisions', () => {
    it('mentions Brazilian law', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/República Federativa do Brasil/i)).toBeInTheDocument()
    })

    it('specifies São Paulo jurisdiction', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/São Paulo\/SP/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has semantic heading structure', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      const mainHeading = screen.getByRole('heading', { name: /Termos de Uso/i, level: 1 })
      expect(mainHeading).toBeInTheDocument()
    })

    it('uses article element for content', () => {
      const { container } = render(<TermsPage />, { wrapper: TestWrapper })

      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })
  })

  describe('typography and styling', () => {
    it('applies prose styling to content', () => {
      const { container } = render(<TermsPage />, { wrapper: TestWrapper })

      const article = container.querySelector('article')
      expect(article).toHaveClass('prose')
    })

    it('supports dark mode prose', () => {
      const { container } = render(<TermsPage />, { wrapper: TestWrapper })

      const article = container.querySelector('article')
      expect(article).toHaveClass('dark:prose-invert')
    })
  })

  describe('layout structure', () => {
    it('wraps content in LegalLayout', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      // Content should be rendered within the legal layout
      expect(screen.getByRole('heading', { name: 'Termos de Uso', level: 1 })).toBeInTheDocument()
    })
  })

  describe('section content', () => {
    it('has multiple sections with detailed content', () => {
      const { container } = render(<TermsPage />, { wrapper: TestWrapper })

      const sections = container.querySelectorAll('section')
      expect(sections.length).toBeGreaterThan(10)
    })

    it('includes lists of user responsibilities', () => {
      const { container } = render(<TermsPage />, { wrapper: TestWrapper })

      const lists = container.querySelectorAll('ul')
      expect(lists.length).toBeGreaterThan(0)
    })
  })

  describe('user obligations', () => {
    it('describes account creation requirements', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(
        screen.getByText(/Fornecer informações verdadeiras e atualizadas/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Manter a confidencialidade de suas credenciais de acesso/i)
      ).toBeInTheDocument()
    })

    it('lists prohibited activities', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(
        screen.getByText(/Usar o serviço para qualquer finalidade ilegal/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/Transmitir vírus, malware ou código malicioso/i)).toBeInTheDocument()
    })
  })

  describe('disclaimers', () => {
    it('includes warranty disclaimer', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/O Plim é fornecido "como está"/i)).toBeInTheDocument()
    })

    it('mentions liability limitations', () => {
      render(<TermsPage />, { wrapper: TestWrapper })

      expect(
        screen.getByText(/Na máxima extensão permitida por lei, o Plim não será responsável/i)
      ).toBeInTheDocument()
    })
  })
})
