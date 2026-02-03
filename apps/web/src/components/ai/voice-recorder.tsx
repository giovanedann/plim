import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, Mic, Square } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface VoiceRecorderProps {
  onRecordingComplete: (
    audioData: string,
    mimeType: 'audio/wav' | 'audio/mp3' | 'audio/webm' | 'audio/ogg'
  ) => Promise<void>
  disabled?: boolean
}

export function VoiceRecorder({
  onRecordingComplete,
  disabled = false,
}: VoiceRecorderProps): React.ReactElement {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        for (const track of stream.getTracks()) {
          track.stop()
        }

        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        setIsProcessing(true)

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()

        reader.onloadend = async () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          if (base64) {
            await onRecordingComplete(base64, 'audio/webm')
          }
          setIsProcessing(false)
          setRecordingDuration(0)
        }

        reader.readAsDataURL(blob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((d) => d + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm text-muted-foreground">Processando audio...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        size="lg"
        variant={isRecording ? 'destructive' : 'default'}
        className={cn('h-16 w-16 rounded-full', isRecording && 'animate-pulse')}
      >
        {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>

      {isRecording ? (
        <p className="text-sm font-medium text-destructive">
          Gravando... {formatDuration(recordingDuration)}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Toque para gravar sua mensagem</p>
      )}
    </div>
  )
}
