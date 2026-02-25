import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useProfile } from '@/hooks/use-profile'
import { useAIStore } from '@/stores/ai.store'
import { Link } from '@tanstack/react-router'
import { CreditCard, FileText, LayoutDashboard, Receipt, Sparkles, Tags } from 'lucide-react'

const navCards = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral',
  },
  {
    title: 'Transações',
    url: '/transactions',
    icon: Receipt,
    description: 'Suas transações',
  },
  {
    title: 'Categorias',
    url: '/categories',
    icon: Tags,
    description: 'Organizar gastos',
  },
  {
    title: 'Cartões',
    url: '/credit-cards',
    icon: CreditCard,
    description: 'Seus cartões',
  },
  {
    title: 'Faturas',
    url: '/invoices',
    icon: FileText,
    description: 'Suas faturas',
  },
] as const

export function HomePage(): React.ReactElement {
  const { profile } = useProfile()
  const openDrawer = useAIStore((s) => s.openDrawer)

  const firstName = profile?.name?.split(' ')[0] ?? ''

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Olá, {firstName}!</h1>
        <p className="text-sm text-muted-foreground mt-1">O que você quer fazer hoje?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {navCards.map((item) => (
          <Link key={item.url} to={item.url} className="no-underline">
            <Card className="flex flex-col items-center justify-center gap-2 p-4 h-28 transition-colors hover:bg-accent active:bg-accent/80 cursor-pointer">
              <item.icon className="h-7 w-7 text-primary" />
              <span className="text-sm font-medium text-foreground">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </Card>
          </Link>
        ))}
      </div>

      <Button size="lg" className="w-full gap-2 mt-auto" onClick={openDrawer}>
        <Sparkles className="h-5 w-5" />
        Plim AI
      </Button>
    </div>
  )
}
