import { isErrorResponse } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-config'
import { aiService } from '@/services'
import { useAIStore } from '@/stores'
import type { ContentPart } from '@plim/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

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

  const sendMessage = useCallback(
    async (content: ContentPart[]) => {
      setIsLoading(true)
      setError(null)

      addMessage({ role: 'user', content })

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
        setError(response.error.message)
        setIsLoading(false)
        toast.error(response.error.message)
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

      if (action?.type === 'expense_created') {
        // Invalidate expense and dashboard queries so they refetch
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.expenses() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
        ])

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
