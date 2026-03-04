import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useConsentStore } from '@/stores/consent.store'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, m } from 'motion/react'

export function ConsentBanner(): React.ReactElement | null {
  const { analyticsConsent, setConsent } = useConsentStore()

  return (
    <AnimatePresence>
      {analyticsConsent === 'pending' && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <Card className="mx-auto flex max-w-lg flex-col gap-3 p-4 shadow-lg sm:flex-row sm:items-center sm:gap-4">
            <p className="text-sm text-muted-foreground">
              Usamos ferramentas de análise para melhorar sua experiência. Você pode aceitar ou
              recusar.{' '}
              <Link to="/privacy" className="underline hover:text-foreground">
                Saiba mais
              </Link>
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => setConsent('denied')}>
                Recusar
              </Button>
              <Button size="sm" onClick={() => setConsent('granted')}>
                Aceitar
              </Button>
            </div>
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  )
}
