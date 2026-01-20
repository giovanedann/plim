import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface OnboardingStepProps {
  icon: ReactNode
  title: string
  description: string
  children?: ReactNode
  className?: string
  iconColorClass?: string
}

export function OnboardingStep({
  icon,
  title,
  description,
  children,
  className,
  iconColorClass = 'text-primary',
}: OnboardingStepProps) {
  const prefersReducedMotion = useReducedMotion()

  const containerAnimation = prefersReducedMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
        transition: { duration: 0.15, ease: 'easeOut' as const },
      }

  const iconAnimation = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { delay: 0.05, duration: 0.2 },
      }

  const titleAnimation = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.1, duration: 0.2 },
      }

  const descriptionAnimation = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.15, duration: 0.2 },
      }

  const childrenAnimation = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.2, duration: 0.2 },
      }

  return (
    <motion.div
      initial={containerAnimation.initial}
      animate={containerAnimation.animate}
      exit={containerAnimation.exit}
      transition={containerAnimation.transition}
      className={cn(
        'flex flex-col items-center text-center px-8 py-12 max-w-lg mx-auto',
        className
      )}
    >
      <motion.div
        initial={iconAnimation.initial}
        animate={iconAnimation.animate}
        transition={iconAnimation.transition}
        className={cn('mb-10', iconColorClass)}
        style={{ filter: 'drop-shadow(0 0 20px currentColor)' }}
      >
        {icon}
      </motion.div>

      <motion.h2
        initial={titleAnimation.initial}
        animate={titleAnimation.animate}
        transition={titleAnimation.transition}
        className="text-3xl font-bold text-foreground mb-6"
      >
        {title}
      </motion.h2>

      <motion.p
        initial={descriptionAnimation.initial}
        animate={descriptionAnimation.animate}
        transition={descriptionAnimation.transition}
        className="text-muted-foreground text-lg leading-relaxed mb-10"
      >
        {description}
      </motion.p>

      {children && (
        <motion.div
          initial={childrenAnimation.initial}
          animate={childrenAnimation.animate}
          transition={childrenAnimation.transition}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}
