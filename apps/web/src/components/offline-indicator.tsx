import { useOnlineStatus } from '@/hooks/use-online-status'
import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'

const MotionOutput = motion.create('output')

export function OfflineIndicator(): React.ReactElement {
  const isOnline = useOnlineStatus()

  return (
    <AnimatePresence>
      {!isOnline && (
        <MotionOutput
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          aria-live="assertive"
          className="fixed top-0 right-0 left-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950"
        >
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          Você está offline. Exibindo dados salvos.
        </MotionOutput>
      )}
    </AnimatePresence>
  )
}
