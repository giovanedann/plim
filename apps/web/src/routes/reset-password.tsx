import { ResetPasswordPage } from '@/pages'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})
