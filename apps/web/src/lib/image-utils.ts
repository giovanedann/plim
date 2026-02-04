const MAX_SIZE = 256
const QUALITY = 0.8

const AI_MAX_DIMENSION = 1024
const AI_QUALITY = 0.85

export async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio and crop to square
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2

      canvas.width = MAX_SIZE
      canvas.height = MAX_SIZE

      // Draw cropped and resized image
      ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX_SIZE, MAX_SIZE)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'))
            return
          }

          const optimizedFile = new File([blob], 'avatar.webp', {
            type: 'image/webp',
          })

          resolve(optimizedFile)
        },
        'image/webp',
        QUALITY
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export async function optimizeImageForAI(
  file: File
): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    img.onload = () => {
      let width = img.width
      let height = img.height

      // Scale down if larger than max dimension
      if (width > AI_MAX_DIMENSION || height > AI_MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * AI_MAX_DIMENSION) / width)
          width = AI_MAX_DIMENSION
        } else {
          width = Math.round((width * AI_MAX_DIMENSION) / height)
          height = AI_MAX_DIMENSION
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'))
            return
          }

          const reader = new FileReader()
          reader.onloadend = () => {
            const result = reader.result as string
            const base64 = result.split(',')[1]
            if (base64) {
              resolve({ base64, mimeType: 'image/jpeg' })
            } else {
              reject(new Error('Failed to extract base64'))
            }
          }
          reader.onerror = () => reject(new Error('Failed to read blob'))
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        AI_QUALITY
      )

      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
    img.src = URL.createObjectURL(file)
  })
}
