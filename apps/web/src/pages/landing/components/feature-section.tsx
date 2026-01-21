import { cn } from '@/lib/utils'
import { Check, type LucideIcon, Monitor } from 'lucide-react'

interface FeatureSectionProps {
  imagePosition: 'left' | 'right'
  badge: string
  headline: string
  description: string
  bulletPoints: string[]
  screenshotLabel: string
  screenshotIcon?: LucideIcon
  isAlternate?: boolean
}

export function FeatureSection({
  imagePosition,
  badge,
  headline,
  description,
  bulletPoints,
  screenshotLabel,
  screenshotIcon: ScreenshotIcon = Monitor,
  isAlternate = false,
}: FeatureSectionProps) {
  return (
    <section
      className={cn(
        'landing-section flex min-h-screen w-full items-center py-16 md:py-0',
        isAlternate ? 'bg-muted/30' : 'bg-background'
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div
          className={cn(
            'flex flex-col gap-8 md:gap-12 lg:gap-16',
            imagePosition === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'
          )}
        >
          {/* Screenshot placeholder */}
          <div className="flex flex-1 items-center justify-center">
            <div
              className={cn(
                'feature-image aspect-video w-full max-w-lg rounded-2xl bg-gradient-to-br shadow-2xl',
                'flex items-center justify-center border',
                'from-muted to-muted/50 border-border',
                imagePosition === 'left' ? 'slide-in-left' : 'slide-in-right'
              )}
            >
              <div className="text-center text-muted-foreground">
                <ScreenshotIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">{screenshotLabel}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-center">
            {/* Badge */}
            <span className="mb-4 inline-block w-fit rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
              {badge}
            </span>

            {/* Headline */}
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              {headline}
            </h2>

            {/* Description */}
            <p className="mb-6 text-base text-muted-foreground md:text-lg">{description}</p>

            {/* Bullet points */}
            <ul className="space-y-3">
              {bulletPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
