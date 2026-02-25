import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Crown, Lock } from 'lucide-react'

export function InvoiceProGate(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/15">
          <Lock className="size-7 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Faturas disponíveis no plano Pro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe suas faturas de cartão de crédito, gerencie pagamentos parciais e tenha
            controle total dos seus gastos no cartão.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-1.5">
          <Link to="/upgrade">
            <Crown className="size-4 text-amber-500" />
            Seja Pro
          </Link>
        </Button>
      </div>
    </div>
  )
}
