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
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import { useState } from 'react'

export function ForgotPasswordPage() {
  const { resetPassword, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await resetPassword(email)
      setEmailSent(true)
    } catch {
      // Error is handled by the store
    }
  }

  if (emailSent) {
    return (
      <>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Email enviado</h1>
          <p className="text-muted-foreground">Verifique sua caixa de entrada</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de recuperação para:
                </p>
                <p className="font-medium">{email}</p>
                <p className="text-sm text-muted-foreground">
                  Clique no link do email para criar uma nova senha. O link expira em 1 hora.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={() => setEmailSent(false)}>
              <Mail className="mr-2 h-4 w-4" />
              Enviar novamente
            </Button>
            <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-1 inline h-3 w-3" />
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
        <h1 className="text-3xl font-bold">Esqueceu sua senha?</h1>
        <p className="text-muted-foreground">Enviaremos um link para você criar uma nova</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>Digite seu email cadastrado</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              Enviar link de recuperação
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
