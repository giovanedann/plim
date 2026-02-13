import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { useInstallPromptStore } from '@/stores/install-prompt.store'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Share, X } from 'lucide-react'
import { useCallback } from 'react'

export function InstallPrompt(): React.ReactElement | null {
  const { canPrompt, isInstalled, isIOS, promptInstall } = useInstallPrompt()
  const { dismissed, showIOSOverlay, dismiss, openIOSOverlay } = useInstallPromptStore()

  const visible = !isInstalled && !dismissed && (canPrompt || isIOS)

  const handleDismiss = useCallback((): void => {
    dismiss()
  }, [dismiss])

  const handleInstall = useCallback(async (): Promise<void> => {
    if (isIOS) {
      openIOSOverlay()
      return
    }
    await promptInstall()
  }, [isIOS, promptInstall, openIOSOverlay])

  if (isInstalled) return null

  return (
    <>
      <AnimatePresence>
        {visible && !showIOSOverlay && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[60] p-4"
          >
            <Card className="mx-auto flex max-w-sm items-center gap-3 p-4 shadow-lg">
              <Download className="h-5 w-5 shrink-0 text-primary" />
              <p className="flex-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Instalar o Plim</span>
                {' \u2014 '}
                Acesse mais rapido na tela inicial
              </p>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" onClick={handleInstall}>
                  Instalar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleDismiss}
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-sm p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Instalar o Plim</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleDismiss}
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Para instalar o Plim no seu iPhone ou iPad:
                </p>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      1
                    </span>
                    <span className="text-muted-foreground">
                      Toque no botao{' '}
                      <Share className="inline-block h-4 w-4 align-text-bottom text-foreground" />{' '}
                      <span className="font-medium text-foreground">Compartilhar</span> na barra do
                      Safari
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      2
                    </span>
                    <span className="text-muted-foreground">
                      Role para baixo e toque em{' '}
                      <span className="font-medium text-foreground">
                        Adicionar a Tela de Inicio
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      3
                    </span>
                    <span className="text-muted-foreground">
                      Toque em <span className="font-medium text-foreground">Adicionar</span> para
                      confirmar
                    </span>
                  </li>
                </ol>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
