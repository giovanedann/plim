import { Camera, Check, Loader2, Trash2, User, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { optimizeImage } from '@/lib/image-utils'

interface AvatarUploadProps {
  avatarUrl: string | null
  name: string | null
  onUpload: (file: File) => void
  onDelete: () => void
  isUploading: boolean
  isDeleting: boolean
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() ?? '?'
  return `${parts[0]?.charAt(0) ?? ''}${parts[parts.length - 1]?.charAt(0) ?? ''}`.toUpperCase()
}

export function AvatarUpload({
  avatarUrl,
  name,
  onUpload,
  onDelete,
  isUploading,
  isDeleting,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPendingFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      e.target.value = ''
    }
  }

  const handleConfirm = async () => {
    if (pendingFile) {
      const optimizedFile = await optimizeImage(pendingFile)
      onUpload(optimizedFile)
      clearPreview()
    }
  }

  const handleCancel = () => {
    clearPreview()
  }

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPendingFile(null)
    setPreviewUrl(null)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const isProcessing = isUploading || isDeleting
  const isPreviewing = pendingFile !== null
  const displayUrl = previewUrl ?? avatarUrl

  return (
    <div className="flex flex-col items-center gap-4" data-tutorial-id="profile-avatar-section">
      <div className="relative">
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-muted bg-muted">
          {displayUrl ? (
            <img src={displayUrl} alt={name ?? 'Avatar'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10">
              {name ? (
                <span className="text-3xl font-semibold text-primary">{getInitials(name)}</span>
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {!isPreviewing && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-md"
            onClick={handleClick}
            disabled={isProcessing}
            aria-label="Alterar foto"
          >
            <Camera className="h-5 w-5" />
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Selecionar foto"
      />

      {isPreviewing ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            <Check className="mr-2 h-4 w-4" />
            Confirmar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </div>
      ) : (
        avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isProcessing}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remover foto
          </Button>
        )
      )}
    </div>
  )
}
