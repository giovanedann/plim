import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { AnimatePresence, motion } from 'motion/react'

interface SkipConfirmationModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function SkipConfirmationModal({ isOpen, onConfirm, onCancel }: SkipConfirmationModalProps) {
  const prefersReducedMotion = useReducedMotion()

  const backdropAnimation = prefersReducedMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }

  const modalAnimation = prefersReducedMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 },
        transition: { duration: 0.15 },
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={backdropAnimation.initial}
          animate={backdropAnimation.animate}
          exit={backdropAnimation.exit}
          transition={backdropAnimation.transition}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
          // biome-ignore lint/a11y/useSemanticElements: motion.div needed for animations
          role="dialog"
          aria-modal="true"
          aria-labelledby="skip-modal-title"
        >
          <motion.div
            initial={modalAnimation.initial}
            animate={modalAnimation.animate}
            exit={modalAnimation.exit}
            transition={modalAnimation.transition}
            className="bg-background border border-border rounded-lg p-6 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="skip-modal-title" className="text-lg font-semibold text-foreground mb-2">
              Tem certeza que deseja pular o tutorial?
            </h3>
            <p className="text-muted-foreground mb-6">
              Você pode revê-lo mais tarde nas Configurações.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={onCancel}>
                Continuar tutorial
              </Button>
              <Button variant="secondary" onClick={onConfirm}>
                Pular
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
