import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import { ArrowLeft, Check, CheckCircle, Eye, EyeOff, KeyRound, Mail, X } from 'lucide-react'
import { useState } from 'react'

type Step = 'email' | 'reset' | 'success'

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {met ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <X className="h-3 w-3 text-destructive" />
      )}
      <span className={met ? 'text-emerald-500' : 'text-muted-foreground'}>{label}</span>
    </div>
  )
}

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
})

type EmailFormData = z.infer<typeof emailSchema>

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter letra maiúscula')
      .regex(/[a-z]/, 'Deve conter letra minúscula')
      .regex(/[0-9]/, 'Deve conter número')
      .regex(/[^A-Za-z0-9]/, 'Deve conter símbolo'),
    confirmPassword: z.string(),
    otpCode: z.string().length(8, 'Digite o código de 8 dígitos'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type ResetFormData = z.infer<typeof resetSchema>

function EmailStep({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (email: string) => void
  isLoading: boolean
  error: string | null
}) {
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const handleSubmit = (data: EmailFormData) => {
    onSubmit(data.email)
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...form.register('email')}
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

function ResetStep({
  email,
  onSuccess,
  onBack,
  isLoading,
  error,
}: {
  email: string
  onSuccess: () => void
  onBack: () => void
  isLoading: boolean
  error: string | null
}) {
  const { verifyRecoveryOtp, updatePassword, resetPassword, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '', otpCode: '' },
  })

  const password = form.watch('password')
  const confirmPassword = form.watch('confirmPassword')
  const otpCode = form.watch('otpCode')

  const otpComplete = otpCode.length === 8

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  }

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword

  const handleSubmit = async (data: ResetFormData) => {
    clearError()

    if (!allRequirementsMet) {
      form.setError('root', { message: 'A senha não atende todos os requisitos' })
      return
    }

    try {
      await verifyRecoveryOtp(email, data.otpCode)
      await updatePassword(data.password)
      onSuccess()
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

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Criar nova senha</h1>
        <p className="text-muted-foreground">
          Escolha sua nova senha e confirme com o código enviado para {email}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
          <CardDescription>Escolha uma senha segura para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <PasswordRequirement
                    met={passwordRequirements.minLength}
                    label="Mínimo 8 caracteres"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasUppercase}
                    label="Uma letra maiúscula"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasLowercase}
                    label="Uma letra minúscula"
                  />
                  <PasswordRequirement met={passwordRequirements.hasNumber} label="Um número" />
                  <PasswordRequirement
                    met={passwordRequirements.hasSymbol}
                    label="Um caractere especial"
                  />
                </div>
              )}
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
              {confirmPassword.length > 0 && (
                <div className="mt-1">
                  <PasswordRequirement met={passwordsMatch} label="Senhas coincidem" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Código de verificação</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={8}
                  value={otpCode}
                  onChange={(value) => form.setValue('otpCode', value)}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                    <InputOTPSlot index={6} />
                    <InputOTPSlot index={7} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Digite o código de 8 dígitos enviado por email
              </p>
            </div>

            {(error || form.formState.errors.root?.message) && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root?.message || error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !otpComplete || !allRequirementsMet || !passwordsMatch}
            >
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
            onClick={onBack}
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

function SuccessStep() {
  const navigate = useNavigate()

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

export function ForgotPasswordPage() {
  const { resetPassword, isLoading, error, clearError } = useAuthStore()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')

  const handleEmailSubmit = async (submittedEmail: string) => {
    clearError()
    try {
      await resetPassword(submittedEmail)
      setEmail(submittedEmail)
      setStep('reset')
    } catch {
      // Error handled by store
    }
  }

  const handleBack = () => {
    setStep('email')
    clearError()
  }

  if (step === 'success') {
    return <SuccessStep />
  }

  if (step === 'reset') {
    return (
      <ResetStep
        email={email}
        onSuccess={() => setStep('success')}
        onBack={handleBack}
        isLoading={isLoading}
        error={error}
      />
    )
  }

  return <EmailStep onSubmit={handleEmailSubmit} isLoading={isLoading} error={error} />
}
