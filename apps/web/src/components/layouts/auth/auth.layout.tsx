import { PlimIcon } from '@/components/icons'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AnimatedPanel } from './animated-panel'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Animated panel (always dark) */}
      <AnimatedPanel />

      {/* Right side - Auth form area */}
      <div className="relative flex flex-col items-center justify-center p-8">
        {/* Theme toggle in top right */}
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        {/* Auth form content */}
        <div className="w-full max-w-md space-y-6">
          {/* Mobile branding - only shown when AnimatedPanel is hidden */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <PlimIcon className="size-16" />
            <h1 className="text-xl font-bold">Plim</h1>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
