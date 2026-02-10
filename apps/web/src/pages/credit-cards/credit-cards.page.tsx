import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { usePlanLimits } from '@/hooks/use-plan-limits'
import { PLAN_LIMITS } from '@plim/shared'
import { Plus } from 'lucide-react'
import { CreditCardList } from './components/credit-card-list'
import { CreditCardModal } from './components/credit-card-modal'
import { useCreditCardsPage } from './use-credit-cards.page'

export function CreditCardsPage() {
  const {
    creditCards,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    selectedCard,
    cardToDelete,
    setCardToDelete,
    openCreateModal,
    openEditModal,
    handleSubmit,
    confirmDelete,
    isPending,
    isDeleting,
  } = useCreditCardsPage()

  const { isPro, isAtLimit } = usePlanLimits()
  const atLimit = isAtLimit('creditCards', creditCards.length)

  const createButton = (className: string) =>
    atLimit ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={className}>
              <Button disabled className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cartão
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Limite de cartões atingido</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <Button onClick={openCreateModal} className={className}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Cartão
      </Button>
    )

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cartões de Crédito</h1>
          <p className="text-sm text-muted-foreground">
            Organize suas despesas por cartão. Apenas para controle, sem dados reais.
          </p>
        </div>
        {createButton('hidden sm:inline-flex')}
      </div>

      {createButton('w-full sm:hidden')}

      {!isPro && (
        <UpgradePrompt
          current={creditCards.length}
          limit={PLAN_LIMITS.free.creditCards}
          featureLabel="cartões"
        />
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : (
        <CreditCardList
          creditCards={creditCards}
          onEdit={openEditModal}
          onDelete={setCardToDelete}
        />
      )}

      <CreditCardModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        creditCard={selectedCard}
        onSubmit={handleSubmit}
        isPending={isPending}
      />

      <AlertDialog open={!!cardToDelete} onOpenChange={() => setCardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cartão "{cardToDelete?.name}"? Esta ação não pode ser
              desfeita. As despesas vinculadas a este cartão não serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
