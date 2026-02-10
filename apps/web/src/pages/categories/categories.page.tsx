import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { usePlanLimits } from '@/hooks/use-plan-limits'
import { PLAN_LIMITS } from '@plim/shared'
import type { Category } from '@plim/shared'
import { Plus, Tags } from 'lucide-react'
import { useState } from 'react'
import { CategoryCard } from './components/category-card'
import { CategoryModal } from './components/category-modal'
import { DeleteCategoryDialog } from './components/delete-category-dialog'
import { useCategoriesPage } from './use-categories.page'

export function CategoriesPage() {
  const {
    systemCategories,
    userCategories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategoriesPage()

  const { isPro, isAtLimit } = usePlanLimits()
  const atLimit = isAtLimit('categories.custom', userCategories.length)

  const [showModal, setShowModal] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | undefined>()
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const handleCreateClick = () => {
    setCategoryToEdit(undefined)
    setShowModal(true)
  }

  const handleEditClick = (category: Category) => {
    setCategoryToEdit(category)
    setShowModal(true)
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
  }

  const handleModalSubmit = async (data: Parameters<typeof createCategory>[0]) => {
    if (categoryToEdit) {
      await updateCategory(categoryToEdit.id, data)
    } else {
      await createCategory(data)
    }
  }

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id)
      setCategoryToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const createButton = (className: string) =>
    atLimit ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={className}>
              <Button disabled className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Limite de categorias atingido</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <Button onClick={handleCreateClick} className={className}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Categoria
      </Button>
    )

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias para organizar suas despesas.
          </p>
        </div>
        {createButton('hidden sm:inline-flex')}
      </div>

      {createButton('w-full sm:hidden')}

      {!isPro && (
        <UpgradePrompt
          current={userCategories.length}
          limit={PLAN_LIMITS.free.categories.custom}
          featureLabel="categorias"
        />
      )}

      {userCategories.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Minhas Categorias</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSystem={false}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </section>
      )}

      {userCategories.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Tags className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhuma categoria personalizada</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie categorias personalizadas para organizar melhor suas despesas.
          </p>
          {!atLimit && (
            <Button className="mt-4" onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Categoria
            </Button>
          )}
        </div>
      )}

      {systemCategories.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Categorias do Sistema</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Estas categorias são padrão e não podem ser editadas ou excluídas.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {systemCategories.map((category) => (
              <CategoryCard key={category.id} category={category} isSystem={true} />
            ))}
          </div>
        </section>
      )}

      <CategoryModal
        open={showModal}
        onOpenChange={setShowModal}
        category={categoryToEdit}
        onSubmit={handleModalSubmit}
        isPending={isCreating || isUpdating}
      />

      <DeleteCategoryDialog
        open={categoryToDelete !== null}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        category={categoryToDelete}
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
      />
    </div>
  )
}
