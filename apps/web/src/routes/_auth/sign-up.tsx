import { SignUpPage } from '@/pages'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/sign-up')({
  component: SignUpPage,
})
