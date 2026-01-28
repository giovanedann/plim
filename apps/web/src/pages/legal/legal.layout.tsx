import { LandingFooter } from '@/pages/landing/components/landing-footer'
import { LandingHeader } from '@/pages/landing/components/landing-header'
import type { ReactNode } from 'react'

interface LegalLayoutProps {
  children: ReactNode
}

export function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 md:py-24">{children}</main>
      <LandingFooter />
    </div>
  )
}
