import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAIStore } from '@/stores'
import { Sparkles } from 'lucide-react'

export function AIChatButton(): React.ReactElement {
  const { toggleDrawer, isPulsing, usage } = useAIStore()

  const remainingRequests = usage?.remainingRequests ?? null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={toggleDrawer}
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700',
          'transition-all duration-300 ease-in-out',
          isPulsing && 'animate-pulse'
        )}
        aria-label="Abrir assistente de IA"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>

      {remainingRequests !== null && (
        <Badge
          variant="secondary"
          className={cn(
            'absolute -top-2 -right-2 min-w-[28px] justify-center',
            'bg-background text-foreground border border-border',
            'text-xs font-medium shadow-sm'
          )}
        >
          {remainingRequests}
        </Badge>
      )}
    </div>
  )
}
