import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { idbPersister } from '@/lib/query-persister'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

const SW_UPDATE_INTERVAL_MS = 60 * 60 * 1000

export function PWAUpdatePrompt(): React.ReactElement | null {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      registration.update()

      setInterval(() => {
        registration.update()
      }, SW_UPDATE_INTERVAL_MS)

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update()
        }
      })
    },
  })

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 z-[60]"
        >
          <Card className="flex items-center gap-3 p-4 shadow-lg">
            <RefreshCw className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">Nova versão disponível!</p>
            <Button
              size="sm"
              onClick={async () => {
                await idbPersister.removeClient()
                await updateServiceWorker(true)
              }}
            >
              Atualizar
            </Button>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
