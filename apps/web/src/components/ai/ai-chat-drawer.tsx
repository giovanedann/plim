import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAIChat } from '@/hooks/use-ai-chat'
import { cn } from '@/lib/utils'
import { type StoredChatMessage, useAIStore } from '@/stores/ai.store'
import type { ContentPart } from '@plim/shared'
import { Bot, Camera, Mic, Send, Sparkles, User } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { ImageUploader } from './image-uploader'
import { VoiceRecorder } from './voice-recorder'

type InputMode = 'text' | 'voice' | 'image'

function getMessageText(content: ContentPart[]): string {
  const textPart = content.find((part) => part.type === 'text')
  return textPart && textPart.type === 'text' ? textPart.text : ''
}

function MessageBubble({ message }: { message: StoredChatMessage }): React.ReactElement {
  const isUser = message.role === 'user'
  const text = getMessageText(message.content)
  const hasImage = message.content.some((part) => part.type === 'image')
  const hasAudio = message.content.some((part) => part.type === 'audio')

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        {hasImage && <div className="mb-2 text-xs text-muted-foreground">[Imagem enviada]</div>}
        {hasAudio && <div className="mb-2 text-xs text-muted-foreground">[Audio enviado]</div>}
        <p className="whitespace-pre-wrap text-sm">{text}</p>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}

export function AIChatDrawer(): React.ReactElement {
  const { isDrawerOpen, closeDrawer, messages, usage } = useAIStore()
  const { sendMessage, isLoading } = useAIChat()
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [textInput, setTextInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleSendText = useCallback(async () => {
    if (!textInput.trim() || isLoading) return

    const text = textInput.trim()
    setTextInput('')
    await sendMessage([{ type: 'text', text }])
    scrollToBottom()
  }, [textInput, isLoading, sendMessage, scrollToBottom])

  const handleSendAudio = useCallback(
    async (audioData: string, mimeType: 'audio/wav' | 'audio/mp3' | 'audio/webm' | 'audio/ogg') => {
      await sendMessage([{ type: 'audio', data: audioData, mimeType }])
      setInputMode('text')
      scrollToBottom()
    },
    [sendMessage, scrollToBottom]
  )

  const handleSendImage = useCallback(
    async (
      imageData: string,
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    ) => {
      await sendMessage([{ type: 'image', data: imageData, mimeType }])
      setInputMode('text')
      scrollToBottom()
    },
    [sendMessage, scrollToBottom]
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
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <SheetTitle>Assistente Plim</SheetTitle>
          </div>
          <SheetDescription>
            {usage
              ? `${usage.remainingRequests} de ${usage.limit} consultas restantes`
              : 'Seu assistente para gerenciar despesas'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                <Sparkles className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Ola! Sou seu assistente.
              </h3>
              <p className="max-w-[280px] text-sm text-muted-foreground">
                Posso ajudar a registrar despesas, consultar gastos e fazer previsoes. Experimente
                dizer:
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground italic">
                  "Comprei um almoco de R$35 no cartao"
                </p>
                <p className="text-sm text-muted-foreground italic">"Quanto gastei esse mes?"</p>
                <p className="text-sm text-muted-foreground italic">
                  "Quanto vou gastar ate marco?"
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl bg-muted px-4 py-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <div className="mb-3 flex justify-center gap-2">
            <Button
              variant={inputMode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('text')}
              className="gap-1"
            >
              <Send className="h-3 w-3" />
              Texto
            </Button>
            <Button
              variant={inputMode === 'voice' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('voice')}
              className="gap-1"
            >
              <Mic className="h-3 w-3" />
              Voz
            </Button>
            <Button
              variant={inputMode === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('image')}
              className="gap-1"
            >
              <Camera className="h-3 w-3" />
              Foto
            </Button>
          </div>

          {inputMode === 'text' && (
            <div className="flex gap-2">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className={cn(
                  'flex-1 resize-none rounded-lg border bg-background px-3 py-2',
                  'text-sm placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring'
                )}
                rows={2}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendText}
                disabled={!textInput.trim() || isLoading}
                size="icon"
                className="h-auto"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          {inputMode === 'voice' && (
            <VoiceRecorder onRecordingComplete={handleSendAudio} disabled={isLoading} />
          )}

          {inputMode === 'image' && (
            <ImageUploader onImageCapture={handleSendImage} disabled={isLoading} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
