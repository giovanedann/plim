import { AlertTriangle, Loader2 } from 'lucide-react'
import { useState } from 'react'
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

function useIsSocialLoginOnly(): boolean {
  const user = useAuthStore((state) => state.user)
  if (!user) return false

  const identities = user.identities ?? []
  const hasEmailProvider = identities.some((identity) => identity.provider === 'email')

  return !hasEmailProvider
}

export function DangerZoneSection() {
  const isSocialLoginOnly = useIsSocialLoginOnly()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState<ConfirmationStep>('warning')
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  function resetModal(): void {
    setStep('warning')
    setConfirmText('')
    setPassword('')
    setIsDeleting(false)
  }

  function handleOpenModal(): void {
    resetModal()
    setIsModalOpen(true)
  }

  function handleCloseModal(): void {
    setIsModalOpen(false)
    resetModal()
  }

  function handleNextStep(): void {
    if (step === 'warning') {
      setStep('type-confirm')
    } else if (step === 'type-confirm' && confirmText === CONFIRMATION_TEXT) {
      if (isSocialLoginOnly) {
        handleDeleteAccount()
      } else {
        setStep('password')
      }
    }
  }

  async function handleDeleteAccount(): Promise<void> {
    if (!isSocialLoginOnly && !password) {
      toast.error('Digite sua senha')
      return
    }

    setIsDeleting(true)
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
      setIsDeleting(false)
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
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder={CONFIRMATION_TEXT}
                    autoComplete="off"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setStep('warning')} disabled={isDeleting}>
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setStep('type-confirm')}
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
