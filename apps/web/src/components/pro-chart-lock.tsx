import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Crown, Lock } from 'lucide-react'

interface ProChartLockProps {
  title: string
  children?: React.ReactNode
}

export function ProChartLock({ title, children }: ProChartLockProps): React.JSX.Element {
  return (
    <div className="relative overflow-hidden rounded-xl border">
      {children && (
        <div className="pointer-events-none select-none blur-[6px] opacity-50">{children}</div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-[2px]">
        <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/15">
          <Lock className="size-5 text-amber-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">Disponível no plano Pro</p>
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link to="/upgrade">
            <Crown className="size-3.5 text-amber-500" />
            Seja Pro
          </Link>
        </Button>
      </div>
    </div>
  )
}
