import { Button } from '@/components/ui/button'
import { optimizeImageForAI } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import { AlertCircle, Camera, Loader2, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface ImageUploaderProps {
  onImageCapture: (
    imageData: string,
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  ) => Promise<void>
  disabled?: boolean
}

export function ImageUploader({
  onImageCapture,
  disabled = false,
}: ImageUploaderProps): React.ReactElement {
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Imagem muito grande. Máximo ${MAX_FILE_SIZE_MB}MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      return
    }

    try {
      const { base64, mimeType } = await optimizeImageForAI(file)
      setPreview(`data:${mimeType};base64,${base64}`)
    } catch (error) {
      console.error('Failed to optimize image:', error)
      // Fallback to original behavior
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleSend = useCallback(async () => {
    if (!preview) return

    setIsProcessing(true)

    const base64 = preview.split(',')[1]
    if (!base64) {
      setIsProcessing(false)
      return
    }

    const mimeTypeMatch = preview.match(/data:([^;]+);/)
    const mimeType = (mimeTypeMatch?.[1] || 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp'
      | 'image/gif'

    await onImageCapture(base64, mimeType)
    setPreview(null)
    setIsProcessing(false)

    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }, [preview, onImageCapture])

  const handleCancel = useCallback(() => {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }, [])

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm text-muted-foreground">Processando imagem...</p>
      </div>
    )
  }

  if (preview) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative">
          <img src={preview} alt="Preview" className="max-h-48 w-full rounded-lg object-contain" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
            onClick={handleCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <Button onClick={handleSend} disabled={disabled}>
          Enviar imagem
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex gap-3">
        <Button
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          variant="outline"
          className={cn('h-16 w-16 flex-col gap-1')}
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs">Camera</span>
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          variant="outline"
          className={cn('h-16 w-16 flex-col gap-1')}
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs">Arquivo</span>
        </Button>
      </div>

      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Tire uma foto ou selecione uma imagem (máx {MAX_FILE_SIZE_MB}MB)
        </p>
      )}
    </div>
  )
}
