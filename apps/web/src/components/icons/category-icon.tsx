import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { getCategoryIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface CategoryIconProps {
  name: string | null | undefined
  color?: string | null
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

const SIZE_MAP = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const

const DOT_SIZE_MAP = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
} as const

/**
 * Renders a category icon with optional color and animation.
 * Falls back to a colored dot if the icon is not found.
 */
export function CategoryIcon({
  name,
  color,
  size = 'md',
  animated = false,
  className,
}: CategoryIconProps) {
  const prefersReducedMotion = useReducedMotion()
  const Icon = getCategoryIcon(name)

  const shouldAnimate = animated && !prefersReducedMotion

  if (!Icon) {
    return (
      <span
        className={cn('inline-block shrink-0 rounded-full', DOT_SIZE_MAP[size], className)}
        style={{ backgroundColor: color ?? 'hsl(var(--muted-foreground))' }}
        aria-hidden="true"
      />
    )
  }

  return (
    <Icon
      className={cn(
        SIZE_MAP[size],
        'shrink-0',
        shouldAnimate && 'transition-transform duration-200 hover:scale-110',
        className
      )}
      style={{ color: color ?? 'hsl(var(--muted-foreground))' }}
      aria-hidden="true"
    />
  )
}
