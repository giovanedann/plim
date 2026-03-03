import { isErrorResponse } from '@/lib/api-client'
import { queryConfig, queryKeys } from '@/lib/query-config'
import { categoryService } from '@/services/category.service'
import type { Category, CreateCategory, UpdateCategory } from '@plim/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useCategoriesPage() {
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const result = await categoryService.listCategories()
      if (isErrorResponse(result)) throw new Error(result.error.message)
      return result.data
    },
    staleTime: queryConfig.staleTime.categories,
  })

  const categories = categoriesQuery.data ?? []

  // System categories have user_id === null
  const systemCategories = categories.filter((c) => c.user_id === null)
  const userCategories = categories.filter((c) => c.user_id !== null)

  const createMutation = useMutation({
    mutationFn: (data: CreateCategory) => categoryService.createCategory(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories })
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories)

      const optimisticCategory: Category = {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        name: data.name,
        icon: data.icon,
        color: data.color,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Category[]>(queryKeys.categories, (old) =>
        old ? [...old, optimisticCategory] : [optimisticCategory]
      )

      return { previous }
    },
    onError: (error, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.categories, context.previous)
      }
      toast.error(error.message || 'Erro ao criar categoria')
    },
    onSuccess: () => {
      toast.success('Categoria criada com sucesso!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategory }) =>
      categoryService.updateCategory(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories })
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories)

      queryClient.setQueryData<Category[]>(queryKeys.categories, (old) =>
        old?.map((cat) =>
          cat.id === id ? { ...cat, ...data, updated_at: new Date().toISOString() } : cat
        )
      )

      return { previous }
    },
    onError: (error, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.categories, context.previous)
      }
      toast.error(error.message || 'Erro ao atualizar categoria')
    },
    onSuccess: () => {
      toast.success('Categoria atualizada com sucesso!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories })
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories)

      queryClient.setQueryData<Category[]>(queryKeys.categories, (old) =>
        old?.filter((cat) => cat.id !== id)
      )

      return { previous }
    },
    onError: (error, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.categories, context.previous)
      }
      toast.error(error.message || 'Erro ao excluir categoria')
    },
    onSuccess: () => {
      toast.success('Categoria excluída com sucesso!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
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
