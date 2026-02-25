import { PlimIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export function LandingHeader() {
  const [isVisible, setIsVisible] = useState(false)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.8
      setIsVisible(window.scrollY > heroHeight)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
        isVisible
          ? 'translate-y-0 bg-slate-950/80 backdrop-blur-md border-b border-white/10'
          : '-translate-y-full'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <PlimIcon className="size-8" />
          <span className="font-semibold text-white">Plim</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {user ? (
            <Button
              asChild
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/home" className="flex items-center gap-2">
                Acessar app
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                <Link to="/sign-in">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="bg-amber-500 text-slate-950 hover:bg-amber-400">
                <Link to="/sign-up">Começar agora</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
