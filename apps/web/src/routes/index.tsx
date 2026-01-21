import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.auth.user) {
      throw redirect({ to: '/dashboard' })
    }
    throw redirect({ to: '/sign-in' })
  },
})
