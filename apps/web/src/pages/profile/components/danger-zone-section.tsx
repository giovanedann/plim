import { AlertTriangle, Loader2 } from 'lucide-react'
import { useReducer } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { accountService } from '@/services/account.service'
import { useAuthStore } from '@/stores/auth.store'

type ConfirmationStep = 'warning' | 'type-confirm' | 'password'

const CONFIRMATION_TEXT = 'EXCLUIR'

interface DangerZoneState {
  isModalOpen: boolean
  step: ConfirmationStep
  confirmText: string
  password: string
  isDeleting: boolean
}

type DangerZoneAction =
  | { type: 'OPEN_DELETE_DIALOG' }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'SET_CONFIRMATION'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'NEXT_STEP'; payload: { isSocialLoginOnly: boolean } }
  | { type: 'PREV_STEP' }
  | { type: 'SET_DELETING'; payload: boolean }
  | { type: 'RESET' }

const initialState: DangerZoneState = {
  isModalOpen: false,
  step: 'warning',
  confirmText: '',
  password: '',
  isDeleting: false,
}

function dangerZoneReducer(state: DangerZoneState, action: DangerZoneAction): DangerZoneState {
  switch (action.type) {
    case 'OPEN_DELETE_DIALOG':
      return { ...initialState, isModalOpen: true }
    case 'CLOSE_DELETE_DIALOG':
      return initialState
    case 'SET_CONFIRMATION':
      return { ...state, confirmText: action.payload }
    case 'SET_PASSWORD':
      return { ...state, password: action.payload }
    case 'NEXT_STEP':
      if (state.step === 'warning') {
        return { ...state, step: 'type-confirm' }
      }
      if (state.step === 'type-confirm' && state.confirmText === CONFIRMATION_TEXT) {
        if (action.payload.isSocialLoginOnly) {
          return state
        }
        return { ...state, step: 'password' }
      }
      return state
    case 'PREV_STEP':
      if (state.step === 'password') {
        return { ...state, step: 'type-confirm' }
      }
      if (state.step === 'type-confirm') {
        return { ...state, step: 'warning' }
      }
      return state
    case 'SET_DELETING':
      return { ...state, isDeleting: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

function useIsSocialLoginOnly(): boolean {
  const user = useAuthStore((state) => state.user)
  if (!user) return false

  const identities = user.identities ?? []
  const hasEmailProvider = identities.some((identity) => identity.provider === 'email')

  return !hasEmailProvider
}

export function DangerZoneSection() {
  const isSocialLoginOnly = useIsSocialLoginOnly()
  const [state, dispatch] = useReducer(dangerZoneReducer, initialState)
  const { isModalOpen, step, confirmText, password, isDeleting } = state

  function handleOpenModal(): void {
    dispatch({ type: 'OPEN_DELETE_DIALOG' })
  }

  function handleCloseModal(): void {
    dispatch({ type: 'CLOSE_DELETE_DIALOG' })
  }

  function handleNextStep(): void {
    if (step === 'type-confirm' && confirmText === CONFIRMATION_TEXT && isSocialLoginOnly) {
      handleDeleteAccount()
      return
    }
    dispatch({ type: 'NEXT_STEP', payload: { isSocialLoginOnly } })
  }

  async function handleDeleteAccount(): Promise<void> {
    if (!isSocialLoginOnly && !password) {
      toast.error('Digite sua senha')
      return
    }

    dispatch({ type: 'SET_DELETING', payload: true })
    try {
      const result = await accountService.deleteAccount(isSocialLoginOnly ? undefined : password)

      if (result.success) {
        toast.success('Conta excluída com sucesso')
        await supabase.auth.signOut()
        window.location.href = '/'
      } else {
        toast.error(result.error || 'Erro ao excluir conta')
      }
    } catch {
      toast.error('Erro ao excluir conta')
    } finally {
      dispatch({ type: 'SET_DELETING', payload: false })
    }
  }

  return (
    <>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam permanentemente sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <h4 className="font-medium text-destructive">Excluir conta</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão excluídos,
                incluindo despesas, categorias, cartões e histórico de salário.
              </p>
              <Button variant="destructive" className="mt-4" onClick={handleOpenModal}>
                Excluir minha conta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          {step === 'warning' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Você tem certeza?
                </DialogTitle>
                <DialogDescription className="space-y-2 pt-2">
                  <p>
                    Esta ação é <strong>permanente</strong> e <strong>irreversível</strong>.
                  </p>
                  <p>Todos os seus dados serão excluídos:</p>
                  <ul className="list-inside list-disc text-sm">
                    <li>Perfil e configurações</li>
                    <li>Todas as despesas</li>
                    <li>Categorias personalizadas</li>
                    <li>Cartões de crédito</li>
                    <li>Histórico de salário</li>
                  </ul>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleNextStep}>
                  Continuar
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'type-confirm' && (
            <>
              <DialogHeader>
                <DialogTitle>Confirme digitando "{CONFIRMATION_TEXT}"</DialogTitle>
                <DialogDescription>
                  Para confirmar que você deseja excluir sua conta, digite a palavra abaixo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="confirm-text">
                    Digite <span className="font-bold">{CONFIRMATION_TEXT}</span> para confirmar
                  </Label>
                  <Input
                    id="confirm-text"
                    value={confirmText}
                    onChange={(e) =>
                      dispatch({ type: 'SET_CONFIRMATION', payload: e.target.value.toUpperCase() })
                    }
                    placeholder={CONFIRMATION_TEXT}
                    autoComplete="off"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => dispatch({ type: 'PREV_STEP' })}
                  disabled={isDeleting}
                >
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleNextStep}
                  disabled={confirmText !== CONFIRMATION_TEXT || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : isSocialLoginOnly ? (
                    'Excluir minha conta'
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'password' && (
            <>
              <DialogHeader>
                <DialogTitle>Confirme sua identidade</DialogTitle>
                <DialogDescription>
                  Digite sua senha para confirmar a exclusão da conta.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => dispatch({ type: 'SET_PASSWORD', payload: e.target.value })}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => dispatch({ type: 'PREV_STEP' })}
                  disabled={isDeleting}
                >
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={!password || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir minha conta'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
