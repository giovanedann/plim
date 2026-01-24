import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth.store'
import { Link, useNavigate } from '@tanstack/react-router'
import { CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useState } from 'react'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword, isLoading, error, clearError, user } = useAuthStore()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationError(null)

    if (password.length < 6) {
      setValidationError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('As senhas não coincidem')
      return
    }

    try {
      await updatePassword(password)
      setSuccess(true)
    } catch {
      // Error is handled by the store
    }
  }

  if (success) {
    return (
      <>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Senha atualizada</h1>
          <p className="text-muted-foreground">Sua senha foi alterada com sucesso</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Tudo pronto!</p>
                <p className="text-sm text-muted-foreground">
                  Sua senha foi atualizada. Você já pode usar sua nova senha para entrar.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate({ to: '/dashboard' })}>
              Ir para o Dashboard
            </Button>
          </CardFooter>
        </Card>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Link inválido</h1>
          <p className="text-muted-foreground">O link de recuperação expirou ou é inválido</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <KeyRound className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Solicite um novo link de recuperação para redefinir sua senha.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full" onClick={() => navigate({ to: '/forgot-password' })}>
              Solicitar novo link
            </Button>
            <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-primary">
              Voltar para login
            </Link>
          </CardFooter>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Nova senha</h1>
        <p className="text-muted-foreground">Escolha uma senha segura</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar nova senha</CardTitle>
          <CardDescription>Sua senha deve ter pelo menos 6 caracteres</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {(error || validationError) && (
              <p className="text-sm text-destructive">{validationError || error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Atualizar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
