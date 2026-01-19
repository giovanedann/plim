import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'motion/react'

interface SkipConfirmationModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function SkipConfirmationModal({ isOpen, onConfirm, onCancel }: SkipConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Tem certeza que deseja pular o tutorial?
            </h3>
            <p className="text-slate-400 mb-6">Você pode revê-lo mais tarde nas Configurações.</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
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
