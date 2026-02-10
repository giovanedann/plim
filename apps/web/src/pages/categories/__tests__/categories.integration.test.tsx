import { ThemeProvider } from '@/components/theme-provider'
import { categoryService } from '@/services/category.service'
import { PLAN_LIMITS, createMockCategory, resetIdCounter } from '@plim/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CategoriesPage } from '../categories.page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/use-plan-limits', () => ({
  usePlanLimits: () => ({
    limits: PLAN_LIMITS.free,
    isPro: false,
    isAtLimit: (_feature: string, current: number) => current >= 5,
    remaining: (_feature: string, current: number) => Math.max(0, 5 - current),
  }),
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

describe('CategoriesPage Integration', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
    resetIdCounter()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('renders page title and description', async () => {
      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [] })

      render(<CategoriesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Categorias')).toBeInTheDocument()
        expect(
          screen.getByText(/Gerencie as categorias para organizar suas despesas/i)
        ).toBeInTheDocument()
      })
    })

    it('shows loading state initially', async () => {
      vi.spyOn(categoryService, 'listCategories').mockImplementation(() => new Promise(() => {}))

      render(<CategoriesPage />, { wrapper: TestWrapper })

      expect(
        screen.getAllByRole('generic').some((el) => el.classList.contains('animate-pulse'))
      ).toBe(true)
    })

    it('shows empty state when no user categories exist', async () => {
      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [] })

      render(<CategoriesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText(/Nenhuma categoria personalizada/i)).toBeInTheDocument()
        expect(
          screen.getByText(/Crie categorias personalizadas para organizar melhor suas despesas/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('category display', () => {
    it('displays system categories separately', async () => {
      const systemCategory = createMockCategory({
        name: 'Alimentação',
        icon: 'utensils',
        user_id: null,
      })

      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [systemCategory] })

      render(<CategoriesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Categorias do Sistema')).toBeInTheDocument()
        expect(
          screen.getByText(/Estas categorias são padrão e não podem ser editadas ou excluídas/i)
        ).toBeInTheDocument()
        expect(screen.getByText('Alimentação')).toBeInTheDocument()
      })
    })

    it('displays user categories separately', async () => {
      const userCategory = createMockCategory({
        name: 'Minha Categoria',
        icon: 'shopping-bag',
        user_id: '00000000-0000-4000-8000-000000000001',
      })

      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [userCategory] })

      render(<CategoriesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Minhas Categorias')).toBeInTheDocument()
        expect(screen.getByText('Minha Categoria')).toBeInTheDocument()
      })
    })

    it('separates system and user categories correctly', async () => {
      const systemCategory = createMockCategory({
        name: 'Sistema',
        user_id: null,
      })
      const userCategory = createMockCategory({
        name: 'Usuário',
        user_id: '00000000-0000-4000-8000-000000000001',
      })

      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({
        data: [systemCategory, userCategory],
      })

      render(<CategoriesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Categorias do Sistema')).toBeInTheDocument()
        expect(screen.getByText('Minhas Categorias')).toBeInTheDocument()
        expect(screen.getByText('Sistema')).toBeInTheDocument()
        expect(screen.getByText('Usuário')).toBeInTheDocument()
      })
    })
  })

  describe('CRUD operations', () => {
    it('shows create category button', async () => {
      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [] })

      render(<CategoriesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        const buttons = screen.getAllByText('Nova Categoria')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('shows create button in empty state', async () => {
      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [] })

      render(<CategoriesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Criar Categoria')).toBeInTheDocument()
      })
    })

    it('opens create modal when clicking create button', async () => {
      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({ data: [] })

      render(<CategoriesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Criar Categoria')).toBeInTheDocument()
      })

      const createButton = screen.getByText('Criar Categoria')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('shows edit and delete options for user categories only', async () => {
      const systemCategory = createMockCategory({
        name: 'Sistema',
        user_id: null,
      })
      const userCategory = createMockCategory({
        name: 'Usuário',
        user_id: '00000000-0000-4000-8000-000000000001',
      })

      vi.spyOn(categoryService, 'listCategories').mockResolvedValue({
        data: [systemCategory, userCategory],
      })

      render(<CategoriesPage />, { wrapper: TestWrapper })

      await waitFor(() => {
        expect(screen.getByText('Sistema')).toBeInTheDocument()
        expect(screen.getByText('Usuário')).toBeInTheDocument()
      })

      const userCategoryCard = screen
        .getByText('Usuário')
        .closest('[class*="rounded-lg"]') as HTMLElement
      const systemCategoryCard = screen
        .getByText('Sistema')
        .closest('[class*="rounded-lg"]') as HTMLElement

      const userButtons = userCategoryCard.querySelectorAll('button')
      expect(userButtons.length).toBe(2)

      const systemButtons = systemCategoryCard.querySelectorAll('button')
      expect(systemButtons.length).toBe(0)
    })
  })
})
