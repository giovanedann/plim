import { isErrorResponse } from '@/lib/api-client'
import { aiService } from '@/services'
import { useAIStore } from '@/stores'
import type { ContentPart } from '@plim/shared'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface UseAIChatReturn {
  sendMessage: (content: ContentPart[]) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function useAIChat(): UseAIChatReturn {
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

      const response = await aiService.chat({ messages: allMessages })

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
        toast.success('Despesa criada com sucesso!', {
          description: 'Sua despesa foi registrada.',
          action: {
            label: 'Ver despesas',
            onClick: () => {
              window.location.href = '/expenses'
            },
          },
        })
      }

      setIsLoading(false)
    },
    [messages, addMessage, setUsage, setPulsing]
  )

  return { sendMessage, isLoading, error }
}
