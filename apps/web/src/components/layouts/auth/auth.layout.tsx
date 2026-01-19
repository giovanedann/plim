import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Outlet } from 'react-router'
import { AnimatedPanel } from './animated-panel'

export function AuthLayout() {
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
          <Outlet />
        </div>
      </div>
    </div>
  )
}
