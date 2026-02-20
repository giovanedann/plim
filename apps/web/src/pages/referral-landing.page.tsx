import PlimIcon from '@/components/icons/plim.icon'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { isErrorResponse } from '@/lib/api-client'
import { referralService } from '@/services/referral.service'
import { useAuthStore } from '@/stores/auth.store'
import type { ValidateReferralCodeResponse } from '@plim/shared'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { Gift, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const REFERRAL_STORAGE_KEY = 'plim_referral_code'

interface ValidationState {
  isLoading: boolean
  data: ValidateReferralCodeResponse | null
  error: boolean
}

export function ReferralLandingPage(): React.ReactElement {
  const { code } = useParams({ from: '/r/$code' })
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  const [validation, setValidation] = useState<ValidationState>({
    isLoading: true,
    data: null,
    error: false,
  })

  useEffect(() => {
    if (isInitialized && user) {
      toast.info('Voce ja esta logado!')
      navigate({ to: '/dashboard' })
      return
    }
  }, [isInitialized, user, navigate])

  useEffect(() => {
    localStorage.setItem(REFERRAL_STORAGE_KEY, code)
  }, [code])

  useEffect(() => {
    let cancelled = false

    async function validate(): Promise<void> {
      setValidation({ isLoading: true, data: null, error: false })

      try {
        const result = await referralService.validateCode(code)

        if (cancelled) return

        if (isErrorResponse(result)) {
          setValidation({ isLoading: false, data: null, error: true })
          return
        }

        setValidation({ isLoading: false, data: result.data, error: false })
      } catch {
        if (!cancelled) {
          setValidation({ isLoading: false, data: null, error: true })
        }
      }
    }

    validate()

    return () => {
      cancelled = true
    }
  }, [code])

  if (validation.isLoading) {
    return <LoadingState />
  }

  const isValid = validation.data?.valid === true
  const referrerName = validation.data?.referrer_name

  if (isValid && referrerName) {
    return <ValidReferralCard referrerName={referrerName} code={code} />
  }

  return <GenericInviteCard />
}

function LoadingState(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <PlimIcon className="size-16" />
        </div>
        <Card>
          <CardHeader className="items-center text-center">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-2 h-5 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter className="justify-center">
            <Skeleton className="h-4 w-32" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

interface ValidReferralCardProps {
  referrerName: string
  code: string
}

function ValidReferralCard({ referrerName, code }: ValidReferralCardProps): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <PlimIcon className="size-16" />
        </div>

        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Gift className="size-6 text-primary" />
            </div>
            <CardTitle className="text-xl">{referrerName} te convidou para o Plim!</CardTitle>
            <CardDescription className="text-base">
              Crie sua conta e ganhe 7 dias de Pro gratis
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full" size="lg">
              <a href={`/sign-up?ref=${encodeURIComponent(code)}`}>Criar conta gratis</a>
            </Button>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Ja tenho conta{' '}
              <Link to="/sign-in" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function GenericInviteCard(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <PlimIcon className="size-16" />
        </div>

        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Voce foi convidado para o Plim!</CardTitle>
            <CardDescription className="text-base">
              Crie sua conta e comece a gerenciar suas financas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full" size="lg">
              <Link to="/sign-up">Criar conta gratis</Link>
            </Button>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Ja tenho conta{' '}
              <Link to="/sign-in" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
