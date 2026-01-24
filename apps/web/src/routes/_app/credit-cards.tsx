import { CreditCardsPage } from '@/pages'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/credit-cards')({
  component: CreditCardsPage,
})
