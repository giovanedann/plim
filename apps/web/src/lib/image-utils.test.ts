import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { optimizeImage } from './image-utils'

describe('image-utils', () => {
  describe('optimizeImage', () => {
    let mockCanvas: {
      width: number
      height: number
      getContext: ReturnType<typeof vi.fn>
      toBlob: ReturnType<typeof vi.fn>
    }
    let mockContext: {
      drawImage: ReturnType<typeof vi.fn>
    }
    let mockImage: {
      onload: (() => void) | null
      onerror: (() => void) | null
      src: string
      width: number
      height: number
    }

    beforeEach(() => {
      vi.clearAllMocks()

      mockContext = {
        drawImage: vi.fn(),
      }

      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockContext),
        toBlob: vi.fn(),
      }

      mockImage = {
        onload: null,
        onerror: null,
        src: '',
        width: 800,
        height: 600,
      }

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement)
      vi.spyOn(globalThis, 'Image').mockImplementation(
        () => mockImage as unknown as HTMLImageElement
      )
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('optimizes image to 256x256 webp format', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const outputBlob = new Blob(['optimized'], { type: 'image/webp' })

      mockCanvas.toBlob.mockImplementation((callback: (blob: Blob) => void) => {
        callback(outputBlob)
      })

      const promise = sut(inputFile)

      // Trigger image load
      mockImage.onload?.()

      const result = await promise

      expect(result.name).toBe('avatar.webp')
      expect(result.type).toBe('image/webp')
    })

    it('sets canvas dimensions to 256x256', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const outputBlob = new Blob(['optimized'], { type: 'image/webp' })

      mockCanvas.toBlob.mockImplementation((callback: (blob: Blob) => void) => {
        callback(outputBlob)
      })

      const promise = sut(inputFile)
      mockImage.onload?.()
      await promise

      expect(mockCanvas.width).toBe(256)
      expect(mockCanvas.height).toBe(256)
    })

    it('crops landscape image from center', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const outputBlob = new Blob(['optimized'], { type: 'image/webp' })

      mockImage.width = 1000
      mockImage.height = 600

      mockCanvas.toBlob.mockImplementation((callback: (blob: Blob) => void) => {
        callback(outputBlob)
      })

      const promise = sut(inputFile)
      mockImage.onload?.()
      await promise

      // For landscape: size = 600 (min), sx = (1000-600)/2 = 200, sy = 0
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        200, // sx - horizontal offset
        0, // sy - vertical offset
        600, // size (crop width)
        600, // size (crop height)
        0, // dx
        0, // dy
        256, // dWidth
        256 // dHeight
      )
    })

    it('crops portrait image from center', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const outputBlob = new Blob(['optimized'], { type: 'image/webp' })

      mockImage.width = 600
      mockImage.height = 1000

      mockCanvas.toBlob.mockImplementation((callback: (blob: Blob) => void) => {
        callback(outputBlob)
      })

      const promise = sut(inputFile)
      mockImage.onload?.()
      await promise

      // For portrait: size = 600 (min), sx = 0, sy = (1000-600)/2 = 200
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        0, // sx - horizontal offset
        200, // sy - vertical offset
        600, // size (crop width)
        600, // size (crop height)
        0, // dx
        0, // dy
        256, // dWidth
        256 // dHeight
      )
    })

    it('handles square image without offset', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const outputBlob = new Blob(['optimized'], { type: 'image/webp' })

      mockImage.width = 500
      mockImage.height = 500

      mockCanvas.toBlob.mockImplementation((callback: (blob: Blob) => void) => {
        callback(outputBlob)
      })

      const promise = sut(inputFile)
      mockImage.onload?.()
      await promise

      // For square: size = 500, sx = 0, sy = 0
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        0, // sx
        0, // sy
        500, // size
        500, // size
        0, // dx
        0, // dy
        256, // dWidth
        256 // dHeight
      )
    })

    it('calls toBlob with webp format and 0.8 quality', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const outputBlob = new Blob(['optimized'], { type: 'image/webp' })

      mockCanvas.toBlob.mockImplementation((callback: (blob: Blob) => void) => {
        callback(outputBlob)
      })

      const promise = sut(inputFile)
      mockImage.onload?.()
      await promise

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.8)
    })

    it('creates object URL from input file', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const outputBlob = new Blob(['optimized'], { type: 'image/webp' })

      mockCanvas.toBlob.mockImplementation((callback: (blob: Blob) => void) => {
        callback(outputBlob)
      })

      const promise = sut(inputFile)
      mockImage.onload?.()
      await promise

      expect(URL.createObjectURL).toHaveBeenCalledWith(inputFile)
      expect(mockImage.src).toBe('blob:test-url')
    })

    it('rejects when canvas context is null', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      mockCanvas.getContext.mockReturnValue(null)

      await expect(sut(inputFile)).rejects.toThrow('Failed to get canvas context')
    })

    it('rejects when image fails to load', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const promise = sut(inputFile)
      mockImage.onerror?.()

      await expect(promise).rejects.toThrow('Failed to load image')
    })

    it('rejects when blob creation fails', async () => {
      const sut = optimizeImage
      const inputFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      mockCanvas.toBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
        callback(null)
      })

      const promise = sut(inputFile)
      mockImage.onload?.()

      await expect(promise).rejects.toThrow('Failed to create blob')
    })
  })
})
