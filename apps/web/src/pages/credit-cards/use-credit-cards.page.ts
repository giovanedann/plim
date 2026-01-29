import { isErrorResponse } from '@/lib/api-client'
import { queryConfig, queryKeys } from '@/lib/query-config'
import { creditCardService } from '@/services/credit-card.service'
import type { CreateCreditCard, CreditCard, UpdateCreditCard } from '@plim/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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

  const createMutation = useMutation({
    mutationFn: (data: CreateCreditCard) => creditCardService.createCreditCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
      toast.success('Cartão criado com sucesso!')
      setIsModalOpen(false)
    },
    onError: () => {
      toast.error('Erro ao criar cartão')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCreditCard }) =>
      creditCardService.updateCreditCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
      toast.success('Cartão atualizado com sucesso!')
      setIsModalOpen(false)
      setSelectedCard(null)
    },
    onError: () => {
      toast.error('Erro ao atualizar cartão')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => creditCardService.deleteCreditCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
      toast.success('Cartão excluído com sucesso!')
      setCardToDelete(null)
    },
    onError: () => {
      toast.error('Erro ao excluir cartão')
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
