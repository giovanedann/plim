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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth.store'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { useState } from 'react'

type Step = 'email' | 'otp' | 'success'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { resetPassword, verifyRecoveryOtp, updatePassword, isLoading, error, clearError } =
    useAuthStore()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await resetPassword(email)
      setStep('otp')
    } catch {
      // Error handled by store
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationError(null)

    if (otpCode.length !== 6) {
      setValidationError('Digite o código de 6 dígitos')
      return
    }

    if (password.length < 6) {
      setValidationError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('As senhas não coincidem')
      return
    }

    try {
      await verifyRecoveryOtp(email, otpCode)
      await updatePassword(password)
      setStep('success')
    } catch {
      // Error handled by store
    }
  }

  const handleResendCode = async () => {
    clearError()
    try {
      await resetPassword(email)
    } catch {
      // Error handled by store
    }
  }

  if (step === 'success') {
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
            <Button className="w-full" onClick={() => navigate({ to: '/sign-in' })}>
              Ir para o login
            </Button>
          </CardFooter>
        </Card>
      </>
    )
  }

  if (step === 'otp') {
    return (
      <>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Verificar código</h1>
          <p className="text-muted-foreground">Digite o código enviado para {email}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova senha</CardTitle>
            <CardDescription>
              Digite o código de 6 dígitos do email e escolha sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Código de verificação</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

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
          <CardFooter className="flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-muted-foreground"
            >
              Reenviar código
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setOtpCode('')
                setPassword('')
                setConfirmPassword('')
                clearError()
              }}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Usar outro email
            </button>
          </CardFooter>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Esqueceu sua senha?</h1>
        <p className="text-muted-foreground">Enviaremos um código para você criar uma nova</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>Digite seu email cadastrado</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Enviar código
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            to="/sign-in"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar para login
          </Link>
        </CardFooter>
      </Card>
    </>
  )
}
