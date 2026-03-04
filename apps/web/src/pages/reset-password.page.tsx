import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AuthLayout } from '@/components/layouts/auth'
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
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Link, useNavigate } from '@tanstack/react-router'
import { CheckCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'

type State = {
  isExchangingCode: boolean
  exchangeError: string | null
  success: boolean
}

type Action =
  | { type: 'EXCHANGE_START' }
  | { type: 'EXCHANGE_ERROR'; error: string }
  | { type: 'EXCHANGE_SUCCESS' }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'EXCHANGE_START':
      return { ...state, isExchangingCode: true, exchangeError: null }
    case 'EXCHANGE_ERROR':
      return { ...state, isExchangingCode: false, exchangeError: action.error }
    case 'EXCHANGE_SUCCESS':
      return { ...state, isExchangingCode: false, exchangeError: null }
    case 'RESET':
      return { ...state, success: true }
  }
}

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordContent />
    </AuthLayout>
  )
}

function ResetPasswordContent() {
  const navigate = useNavigate()
  const { updatePassword, isLoading, error, clearError, user } = useAuthStore()
  const hasExchangedCode = useRef(false)

  const [state, dispatch] = useReducer(reducer, {
    isExchangingCode: true,
    exchangeError: null,
    success: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    const handleCodeExchange = async () => {
      if (hasExchangedCode.current) return
      hasExchangedCode.current = true

      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const errorParam = hashParams.get('error')
      const errorDescription = hashParams.get('error_description')

      if (errorParam) {
        dispatch({
          type: 'EXCHANGE_ERROR',
          error: errorDescription || 'Link inválido ou expirado',
        })
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)

      if (error) {
        dispatch({ type: 'EXCHANGE_ERROR', error: error.message })
        return
      }

      dispatch({ type: 'EXCHANGE_SUCCESS' })
    }

    handleCodeExchange()
  }, [])

  const handleSubmit = async (data: ResetPasswordFormData) => {
    clearError()

    try {
      await updatePassword(data.password)
      dispatch({ type: 'RESET' })
    } catch {
      // Error is handled by the store
    }
  }

  if (state.isExchangingCode) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Validando link...</p>
        </div>
      </div>
    )
  }

  if (state.success) {
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
            <Button className="w-full" onClick={() => navigate({ to: '/home' })}>
              Ir para o início
            </Button>
          </CardFooter>
        </Card>
      </>
    )
  }

  if (state.exchangeError || !user) {
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
                  {state.exchangeError ||
                    'Solicite um novo link de recuperação para redefinir sua senha.'}
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
          <form
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              if (errors.confirmPassword) {
                form.setError('root', { message: 'As senhas não coincidem' })
              } else if (errors.password) {
                form.setError('root', { message: errors.password.message })
              }
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...form.register('password')}
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
                  {...form.register('confirmPassword')}
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

            {(error || form.formState.errors.root?.message) && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root?.message || error}
              </p>
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
