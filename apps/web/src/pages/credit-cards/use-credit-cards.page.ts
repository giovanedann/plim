import { isErrorResponse } from '@/lib/api-client'
import { queryConfig, queryKeys } from '@/lib/query-config'
import { creditCardService } from '@/services/credit-card.service'
import { invoiceService } from '@/services/invoice.service'
import type {
  CreateCreditCard,
  CreditCard,
  CreditCardLimitUsage,
  UpdateCreditCard,
} from '@plim/shared'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export function useCreditCardsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null)
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null)

  const creditCardsQuery = useQuery({
    queryKey: queryKeys.creditCards,
    queryFn: async () => {
      const response = await creditCardService.listCreditCards()
      if (isErrorResponse(response)) throw new Error(response.error.message)
      return response.data
    },
    staleTime: queryConfig.staleTime.creditCards,
  })

  const cardsWithLimit = creditCardsQuery.data?.filter((card) => card.credit_limit_cents) ?? []

  const limitUsageQueries = useQueries({
    queries: cardsWithLimit.map((card) => ({
      queryKey: queryKeys.limitUsage(card.id),
      queryFn: async () => {
        const response = await invoiceService.getLimitUsage(card.id)
        if (isErrorResponse(response)) throw new Error(response.error.message)
        return response.data
      },
      staleTime: queryConfig.staleTime.limitUsage,
      enabled: !!card.credit_limit_cents,
    })),
  })

  const limitUsages = useMemo(() => {
    const record: Record<string, CreditCardLimitUsage> = {}
    for (let i = 0; i < cardsWithLimit.length; i++) {
      const card = cardsWithLimit[i]
      const query = limitUsageQueries[i]
      if (card && query?.data) {
        record[card.id] = query.data
      }
    }
    return record
  }, [cardsWithLimit, limitUsageQueries])

  const createMutation = useMutation({
    mutationFn: (data: CreateCreditCard) => creditCardService.createCreditCard(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.creditCards })
      const previous = queryClient.getQueryData<CreditCard[]>(queryKeys.creditCards)

      const optimisticCard: CreditCard = {
        id: crypto.randomUUID(),
        user_id: '',
        name: data.name,
        color: data.color,
        bank: data.bank,
        flag: data.flag,
        last_4_digits: data.last_4_digits ?? null,
        expiration_day: data.expiration_day ?? null,
        closing_day: data.closing_day ?? null,
        credit_limit_cents: data.credit_limit_cents ?? null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData<CreditCard[]>(queryKeys.creditCards, (old) =>
        old ? [...old, optimisticCard] : [optimisticCard]
      )

      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.creditCards, context.previous)
      }
      toast.error('Erro ao criar cartão')
    },
    onSuccess: () => {
      toast.success('Cartão criado com sucesso!')
      setIsModalOpen(false)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCreditCard }) =>
      creditCardService.updateCreditCard(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.creditCards })
      const previous = queryClient.getQueryData<CreditCard[]>(queryKeys.creditCards)

      queryClient.setQueryData<CreditCard[]>(queryKeys.creditCards, (old) =>
        old?.map((card) =>
          card.id === id ? { ...card, ...data, updated_at: new Date().toISOString() } : card
        )
      )

      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.creditCards, context.previous)
      }
      toast.error('Erro ao atualizar cartão')
    },
    onSuccess: () => {
      toast.success('Cartão atualizado com sucesso!')
      setIsModalOpen(false)
      setSelectedCard(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => creditCardService.deleteCreditCard(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.creditCards })
      const previous = queryClient.getQueryData<CreditCard[]>(queryKeys.creditCards)

      queryClient.setQueryData<CreditCard[]>(queryKeys.creditCards, (old) =>
        old?.filter((card) => card.id !== id)
      )

      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.creditCards, context.previous)
      }
      toast.error('Erro ao excluir cartão')
    },
    onSuccess: () => {
      toast.success('Cartão excluído com sucesso!')
      setCardToDelete(null)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
    },
  })

  const openCreateModal = () => {
    setSelectedCard(null)
    setIsModalOpen(true)
  }

  const openEditModal = (card: CreditCard) => {
    setSelectedCard(card)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: CreateCreditCard) => {
    if (selectedCard) {
      await updateMutation.mutateAsync({ id: selectedCard.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const confirmDelete = async () => {
    if (cardToDelete) {
      await deleteMutation.mutateAsync(cardToDelete.id)
    }
  }

  return {
    creditCards: creditCardsQuery.data || [],
    limitUsages,
    isLoading: creditCardsQuery.isLoading,
    isModalOpen,
    setIsModalOpen,
    selectedCard,
    cardToDelete,
    setCardToDelete,
    openCreateModal,
    openEditModal,
    handleSubmit,
    confirmDelete,
    isPending: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
