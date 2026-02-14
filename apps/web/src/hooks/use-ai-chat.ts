import { analytics } from '@/lib/analytics'
import { isErrorResponse } from '@/lib/api-client'
import {
  type ExpenseChange,
  addExpensesToCache,
  applyOptimisticDashboardUpdate,
} from '@/lib/optimistic-updates'
import { queryKeys } from '@/lib/query-config'
import { aiService } from '@/services'
import { useAIStore, useTutorialStore } from '@/stores'
import type { Category, ContentPart, CreditCard, Expense } from '@plim/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useFeatureFlag } from './use-feature-flag'

const API_TIMEOUT_MS = 30_000

interface UseAIChatReturn {
  sendMessage: (content: ContentPart[]) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function useAIChat(): UseAIChatReturn {
  const queryClient = useQueryClient()
  const { messages, addMessage, setUsage, setPulsing } = useAIStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tutorialsEnabled = useFeatureFlag('enable-tutorials', true)
  const tutorialsEnabledRef = useRef(tutorialsEnabled)
  tutorialsEnabledRef.current = tutorialsEnabled

  const sendMessage = useCallback(
    async (content: ContentPart[]) => {
      setIsLoading(true)
      setError(null)

      addMessage({ role: 'user', content })
      analytics.aiMessageSent(content.some((p) => p.type === 'image') ? 'image' : 'text')

      const allMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content },
      ]

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), API_TIMEOUT_MS)
      })

      let response: Awaited<ReturnType<typeof aiService.chat>>
      try {
        response = await Promise.race([aiService.chat({ messages: allMessages }), timeoutPromise])
      } catch (err) {
        const isTimeout = err instanceof Error && err.message === 'timeout'
        const errorMessage = isTimeout
          ? 'A requisição demorou muito. Tente novamente.'
          : 'Erro ao processar mensagem. Tente novamente.'
        setError(errorMessage)
        setIsLoading(false)
        toast.error(errorMessage)
        return
      }

      if (isErrorResponse(response)) {
        const isLimitReached = response.error.code === 'FORBIDDEN'
        const message = isLimitReached
          ? 'Voce atingiu o limite semanal. Atualize para o Pro!'
          : response.error.message
        setError(message)
        setIsLoading(false)
        toast.error(
          message,
          isLimitReached
            ? {
                action: { label: 'Ver planos', onClick: () => window.location.assign('/upgrade') },
              }
            : undefined
        )
        return
      }

      const { message, action, usageInfo } = response.data

      addMessage({
        role: 'assistant',
        content: [{ type: 'text', text: message }],
      })

      setUsage(usageInfo)

      setPulsing(true)
      setTimeout(() => setPulsing(false), 1000)

      if (action?.type === 'show_tutorial' && action.data && tutorialsEnabledRef.current) {
        const { tutorial_id } = action.data as { tutorial_id: string }
        const { startTutorialById } = useTutorialStore.getState()
        startTutorialById(tutorial_id)
        useAIStore.getState().closeDrawer()
      }

      if (action?.type === 'expense_created' && action.data) {
        const expense = action.data as Expense

        const categories = queryClient.getQueryData<Category[]>(queryKeys.categories)
        const creditCards = queryClient.getQueryData<CreditCard[]>(queryKeys.creditCards)
        const category = categories?.find((c) => c.id === expense.category_id)
        const creditCard = creditCards?.find((c) => c.id === expense.credit_card_id)

        const change: ExpenseChange = {
          amount_cents: expense.amount_cents,
          category_id: expense.category_id,
          category_name: category?.name,
          category_color: category?.color,
          category_icon: category?.icon,
          payment_method: expense.payment_method,
          credit_card_id: expense.credit_card_id,
          credit_card_name: creditCard?.name,
          credit_card_color: creditCard?.color,
          credit_card_bank: creditCard?.bank,
          credit_card_flag: creditCard?.flag,
          date: expense.date,
          installment_total: expense.installment_total ?? undefined,
          operation: 'add',
        }

        applyOptimisticDashboardUpdate(queryClient, change)
        addExpensesToCache(queryClient, expense)

        queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })

        toast.success('Despesa criada com sucesso!', {
          description: 'Sua despesa foi registrada.',
        })
      }

      setIsLoading(false)
    },
    [messages, addMessage, setUsage, setPulsing, queryClient]
  )

  return { sendMessage, isLoading, error }
}
