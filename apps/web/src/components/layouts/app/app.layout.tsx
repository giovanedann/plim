import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Outlet } from 'react-router'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header placeholder */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold">MyFinances</div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  )
}
