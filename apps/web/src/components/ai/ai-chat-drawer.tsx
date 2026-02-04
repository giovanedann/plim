import { PlimIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAIChat } from '@/hooks/use-ai-chat'
import { useProfile } from '@/hooks/use-profile'
import { cn } from '@/lib/utils'
import { type StoredChatMessage, useAIStore } from '@/stores/ai.store'
import { useAuthStore } from '@/stores/auth.store'
import type { ContentPart } from '@plim/shared'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, ImageIcon, Info, Mic, Send, Sparkles, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ImageUploader } from './image-uploader'
import { VoiceRecorder } from './voice-recorder'

type InputMode = 'text' | 'voice' | 'image'

function getMessageText(content: ContentPart[]): string {
  const textPart = content.find((part) => part.type === 'text')
  return textPart && textPart.type === 'text' ? textPart.text : ''
}

function UserAvatar({ className }: { className?: string }): React.ReactElement {
  const { user } = useAuthStore()
  const { profile } = useProfile()

  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url
  const displayName = profile?.name ?? user?.email?.split('@')[0] ?? 'U'

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt="Avatar" className={cn('rounded-full object-cover', className)} />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-primary-foreground',
        className
      )}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  )
}

function BotAvatar({ className }: { className?: string }): React.ReactElement {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 shadow-sm',
        className
      )}
    >
      <PlimIcon className="h-5 w-5" />
    </div>
  )
}

function MessageBubble({
  message,
}: {
  message: StoredChatMessage
}): React.ReactElement {
  const isUser = message.role === 'user'
  const text = getMessageText(message.content)
  const hasImage = message.content.some((part) => part.type === 'image')
  const hasAudio = message.content.some((part) => part.type === 'audio')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 1,
      }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && <BotAvatar className="h-9 w-9 shrink-0" />}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
            : 'bg-card text-card-foreground border border-border/50'
        )}
      >
        {hasImage && (
          <div className="mb-2 flex items-center gap-1.5 text-xs opacity-70">
            <ImageIcon className="h-3 w-3" />
            <span>Imagem enviada</span>
          </div>
        )}
        {hasAudio && (
          <div className="mb-2 flex items-center gap-1.5 text-xs opacity-70">
            <Volume2 className="h-3 w-3" />
            <span>Áudio enviado</span>
          </div>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
      </motion.div>

      {isUser && <UserAvatar className="h-9 w-9 shrink-0" />}
    </motion.div>
  )
}

function TypingIndicator(): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3"
    >
      <BotAvatar className="h-9 w-9 shrink-0" />
      <div className="rounded-2xl bg-card border border-border/50 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="h-2 w-2 rounded-full bg-muted-foreground/60"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
          />
          <motion.span
            className="h-2 w-2 rounded-full bg-muted-foreground/60"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.15 }}
          />
          <motion.span
            className="h-2 w-2 rounded-full bg-muted-foreground/60"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState(): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-full flex-col items-center justify-center text-center px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-lg">
          <PlimIcon className="h-12 w-12" />
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 text-xl font-semibold text-foreground"
      >
        Olá! Sou seu assistente.
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-[300px] text-sm text-muted-foreground mb-6"
      >
        Posso ajudar a registrar despesas, consultar gastos e fazer previsões financeiras.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
          Experimente dizer
        </p>
        {[
          '"Comprei um almoço de R$35 no cartão"',
          '"Quanto gastei esse mês?"',
          '"Quanto vou gastar até março?"',
        ].map((example, index) => (
          <motion.p
            key={example}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="text-sm text-muted-foreground/80 italic"
          >
            {example}
          </motion.p>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60"
      >
        <Info className="h-3 w-3" />A IA pode cometer erros. Verifique informações importantes.
      </motion.p>
    </motion.div>
  )
}

function ClearChatButton(): React.ReactElement {
  const { clearMessages, messages } = useAIStore()

  if (messages.length === 0) return <></>

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
        >
          Limpar histórico
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar conversa?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso irá apagar todo o histórico da conversa. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={clearMessages}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Limpar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function getUsageDisplay(
  usage: {
    text: { remaining: number; limit: number; used: number }
    voice: { remaining: number; limit: number; used: number }
    image: { remaining: number; limit: number; used: number }
  } | null,
  mode: InputMode
): string {
  if (!usage) return 'Seu assistente financeiro inteligente'

  const typeUsage = usage[mode]
  if (!typeUsage) return 'Seu assistente financeiro inteligente'

  const modeLabels = { text: 'texto', voice: 'voz', image: 'imagem' }

  if (typeUsage.remaining === 0) {
    return `Limite de ${modeLabels[mode]} atingido (${typeUsage.used}/${typeUsage.limit} usados)`
  }

  return `${typeUsage.remaining} de ${typeUsage.limit} ${modeLabels[mode]} restantes`
}

export function AIChatDrawer(): React.ReactElement {
  const { isDrawerOpen, closeDrawer, messages, usage } = useAIStore()
  const { sendMessage, isLoading } = useAIChat()
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [textInput, setTextInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    if (isDrawerOpen && inputMode === 'text') {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isDrawerOpen, inputMode])

  const handleSendText = useCallback(async () => {
    if (!textInput.trim() || isLoading) return

    const text = textInput.trim()
    setTextInput('')
    await sendMessage([{ type: 'text', text }])
  }, [textInput, isLoading, sendMessage])

  const handleSendAudio = useCallback(
    async (audioData: string, mimeType: 'audio/wav' | 'audio/mp3' | 'audio/webm' | 'audio/ogg') => {
      await sendMessage([{ type: 'audio', data: audioData, mimeType }])
      setInputMode('text')
    },
    [sendMessage]
  )

  const handleSendImage = useCallback(
    async (
      imageData: string,
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    ) => {
      await sendMessage([{ type: 'image', data: imageData, mimeType }])
      setInputMode('text')
    },
    [sendMessage]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendText()
      }
    },
    [handleSendText]
  )

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl"
      >
        {/* Header */}
        <SheetHeader className="border-b bg-gradient-to-r from-background to-muted/30 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-sm shrink-0">
              <PlimIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="flex items-center gap-2">
                Assistente Plim
                <Sparkles className="h-4 w-4 text-amber-500" />
              </SheetTitle>
              <SheetDescription className="text-xs">
                {getUsageDisplay(usage, inputMode)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-background to-muted/10">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </AnimatePresence>

              <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          {/* Clear History */}
          <div className="mb-2 flex justify-center">
            <ClearChatButton />
          </div>

          {/* Mode Selector */}
          <div className="mb-3 flex justify-center gap-1">
            {[
              { mode: 'text' as const, icon: Send, label: 'Texto' },
              { mode: 'voice' as const, icon: Mic, label: 'Voz' },
              { mode: 'image' as const, icon: Camera, label: 'Foto' },
            ].map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant={inputMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInputMode(mode)}
                className={cn('gap-1.5 transition-all', inputMode === mode && 'shadow-sm')}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>

          {/* Text Input */}
          {inputMode === 'text' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className={cn(
                  'flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-3',
                  'text-sm placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50',
                  'transition-all duration-200'
                )}
                rows={2}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendText}
                disabled={!textInput.trim() || isLoading}
                className="h-auto min-w-[56px] rounded-xl px-5 shadow-sm sm:min-w-[64px] sm:px-6"
              >
                <Send className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Voice Input */}
          {inputMode === 'voice' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <VoiceRecorder onRecordingComplete={handleSendAudio} disabled={isLoading} />
            </motion.div>
          )}

          {/* Image Input */}
          {inputMode === 'image' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <ImageUploader onImageCapture={handleSendImage} disabled={isLoading} />
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
