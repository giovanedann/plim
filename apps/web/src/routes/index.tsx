import { LandingPage } from '@/pages/landing'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.auth.isInitialized && context.auth.user) {
      throw redirect({ to: '/home' })
    }
  },
  component: LandingPage,
})
