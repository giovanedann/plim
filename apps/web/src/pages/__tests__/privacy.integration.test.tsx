import { ThemeProvider } from '@/components/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrivacyPage } from '../legal/privacy.page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useRouter: () => ({ state: { location: { pathname: '/privacy' } } }),
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

describe('PrivacyPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('renders page heading', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(
        screen.getByRole('heading', { name: 'Política de Privacidade', level: 1 })
      ).toBeInTheDocument()
    })

    it('shows last updated date', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Última atualização: 12 de fevereiro de 2026/i)).toBeInTheDocument()
    })
  })

  describe('main sections', () => {
    it('renders introduction section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/1. Introdução/i)).toBeInTheDocument()
    })

    it('renders data collection section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/2. Dados que Coletamos/i)).toBeInTheDocument()
    })

    it('renders data usage section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/3. Como Usamos seus Dados/i)).toBeInTheDocument()
    })

    it('renders storage and security section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/4. Armazenamento e Segurança/i)).toBeInTheDocument()
    })

    it('renders data sharing section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/5. Compartilhamento de Dados/i)).toBeInTheDocument()
    })

    it('renders user rights section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/6. Seus Direitos \(LGPD Art. 18\)/i)).toBeInTheDocument()
    })

    it('renders data retention section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/7. Retenção de Dados/i)).toBeInTheDocument()
    })

    it('renders cookies section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/8. Cookies e Analytics/i)).toBeInTheDocument()
    })

    it('renders minors section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/9. Menores de Idade/i)).toBeInTheDocument()
    })

    it('renders policy changes section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/10. Alterações nesta Política/i)).toBeInTheDocument()
    })

    it('renders contact section', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/11. Contato/i)).toBeInTheDocument()
    })
  })

  describe('LGPD compliance', () => {
    it('mentions LGPD law number', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Lei nº 13.709\/2018/i)).toBeInTheDocument()
    })

    it('lists LGPD user rights', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getAllByText(/Confirmação e Acesso/i)[0]).toBeInTheDocument()
      expect(screen.getAllByText(/Correção/i)[0]).toBeInTheDocument()
      expect(screen.getAllByText(/Portabilidade/i)[0]).toBeInTheDocument()
      expect(screen.getAllByText(/Eliminação/i)[0]).toBeInTheDocument()
    })
  })

  describe('data collection details', () => {
    it('describes registration data', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/2.1 Dados de Cadastro/i)).toBeInTheDocument()
      expect(screen.getByText(/Endereço de e-mail/i)).toBeInTheDocument()
      expect(screen.getByText(/Nome completo/i)).toBeInTheDocument()
    })

    it('describes financial data', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/2.2 Dados Financeiros/i)).toBeInTheDocument()
      expect(screen.getByText(/Despesas e suas descrições/i)).toBeInTheDocument()
      expect(screen.getByText(/Informações de salários/i)).toBeInTheDocument()
    })

    it('describes technical data', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/2.3 Dados Técnicos/i)).toBeInTheDocument()
      expect(screen.getByText(/Preferências de tema/i)).toBeInTheDocument()
    })
  })

  describe('security measures', () => {
    it('describes AES-256 encryption', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Criptografia AES-256/i)).toBeInTheDocument()
    })

    it('mentions Row Level Security', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Row Level Security \(RLS\)/i)).toBeInTheDocument()
    })

    it('mentions Supabase Vault', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Supabase Vault/i)).toBeInTheDocument()
    })

    it('mentions HTTPS encryption', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/HTTPS/i)).toBeInTheDocument()
    })
  })

  describe('contact information', () => {
    it('displays privacy email', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      const emailLinks = screen.getAllByRole('link', { name: /privacidade@plim.app.br/i })
      expect(emailLinks.length).toBeGreaterThan(0)
      expect(emailLinks[0]).toHaveAttribute('href', 'mailto:privacidade@plim.app.br')
    })

    it('mentions response time', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getAllByText(/Até 15 dias úteis/i)[0]).toBeInTheDocument()
    })
  })

  describe('data usage', () => {
    it('lists legitimate uses', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(
        screen.getByText(/Fornecer as funcionalidades de gestão financeira do Plim/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/Manter sua conta segura e autenticada/i)).toBeInTheDocument()
    })

    it('clarifies what data is NOT used for', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Exibir anúncios publicitários/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Vender ou compartilhar com terceiros para fins comerciais/i)
      ).toBeInTheDocument()
    })
  })

  describe('cookies policy', () => {
    it('describes cookie usage', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Manter sua sessão de autenticação ativa/i)).toBeInTheDocument()
      expect(screen.getByText(/Armazenar sua preferência de tema/i)).toBeInTheDocument()
    })

    it('clarifies no tracking cookies', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/cookies de publicidade ou rastreamento/i)).toBeInTheDocument()
    })
  })

  describe('data retention', () => {
    it('describes deletion timeline', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(
        screen.getByText(/Seus dados são removidos do sistema principal em até 30 dias/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Backups de segurança são eliminados em até 90 dias/i)
      ).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has semantic heading structure', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      const mainHeading = screen.getByRole('heading', {
        name: /Política de Privacidade/i,
        level: 1,
      })
      expect(mainHeading).toBeInTheDocument()
    })

    it('uses article element for content', () => {
      const { container } = render(<PrivacyPage />, { wrapper: TestWrapper })

      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })
  })

  describe('typography and styling', () => {
    it('applies prose styling to content', () => {
      const { container } = render(<PrivacyPage />, { wrapper: TestWrapper })

      const article = container.querySelector('article')
      expect(article).toHaveClass('prose')
    })

    it('supports dark mode prose', () => {
      const { container } = render(<PrivacyPage />, { wrapper: TestWrapper })

      const article = container.querySelector('article')
      expect(article).toHaveClass('dark:prose-invert')
    })
  })

  describe('layout structure', () => {
    it('wraps content in LegalLayout', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      // Content should be rendered within the legal layout
      expect(
        screen.getByRole('heading', { name: 'Política de Privacidade', level: 1 })
      ).toBeInTheDocument()
    })
  })

  describe('section content', () => {
    it('has multiple sections with detailed content', () => {
      const { container } = render(<PrivacyPage />, { wrapper: TestWrapper })

      const sections = container.querySelectorAll('section')
      expect(sections.length).toBeGreaterThan(10)
    })

    it('includes lists of data types and rights', () => {
      const { container } = render(<PrivacyPage />, { wrapper: TestWrapper })

      const lists = container.querySelectorAll('ul')
      expect(lists.length).toBeGreaterThan(0)
    })
  })

  describe('data sharing policy', () => {
    it('states no third-party sharing', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Não compartilhamos seus dados pessoais/i)).toBeInTheDocument()
    })

    it('lists exceptions for data sharing', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Quando exigido por lei ou ordem judicial/i)).toBeInTheDocument()
    })
  })

  describe('age restrictions', () => {
    it('mentions minimum age requirement', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/maiores de 18 anos/i)).toBeInTheDocument()
    })
  })

  describe('policy updates', () => {
    it('describes notification process', () => {
      render(<PrivacyPage />, { wrapper: TestWrapper })

      expect(screen.getByText(/Notificaremos você por e-mail/i)).toBeInTheDocument()
      expect(screen.getByText(/Exibiremos um aviso no aplicativo/i)).toBeInTheDocument()
    })
  })
})
