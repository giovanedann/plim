import { categoryService } from '@/services/category.service'
import type { CreateCategory, UpdateCategory } from '@myfinances/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useCategoriesPage() {
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.listCategories(),
  })

  const categories = categoriesQuery.data?.data ?? []

  // System categories have user_id === null
  const systemCategories = categories.filter((c) => c.user_id === null)
  const userCategories = categories.filter((c) => c.user_id !== null)

  const createMutation = useMutation({
    mutationFn: (data: CreateCategory) => categoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria criada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar categoria')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategory }) =>
      categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar categoria')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Categoria excluída com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao excluir categoria')
    },
  })

  const createCategory = (data: CreateCategory) => createMutation.mutateAsync(data)
  const updateCategory = (id: string, data: UpdateCategory) =>
    updateMutation.mutateAsync({ id, data })
  const deleteCategory = (id: string) => deleteMutation.mutateAsync(id)

  return {
    categories,
    systemCategories,
    userCategories,
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
