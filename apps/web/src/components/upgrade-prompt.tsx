import { Progress } from '@/components/ui/progress'
import { Link } from '@tanstack/react-router'
import { Crown } from 'lucide-react'

interface UpgradePromptProps {
  current: number
  limit: number
  featureLabel: string
}

export function UpgradePrompt({
  current,
  limit,
  featureLabel,
}: UpgradePromptProps): React.JSX.Element {
  const percent = Math.round((current / limit) * 100)
  const atLimit = current >= limit

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {current}/{limit} {featureLabel} usadas
        </span>
        {atLimit && (
          <Link
            to="/upgrade"
            className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <Crown className="size-3" />
            Seja Pro
          </Link>
        )}
      </div>
      <Progress value={percent} className="h-2" />
      {atLimit && (
        <p className="mt-2 text-xs text-muted-foreground">
          Limite atingido —{' '}
          <Link
            to="/upgrade"
            className="font-medium text-amber-600 hover:underline dark:text-amber-400"
          >
            Seja Pro
          </Link>
        </p>
      )}
    </div>
  )
}
