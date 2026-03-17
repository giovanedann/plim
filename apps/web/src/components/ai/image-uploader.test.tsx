import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageUploader } from './image-uploader'

vi.mock('@/lib/image-utils', () => ({
  optimizeImageForAI: vi.fn(),
}))

import { optimizeImageForAI } from '@/lib/image-utils'

function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(size).fill('a').join('')
  return new File([content], name, { type })
}

describe('ImageUploader', () => {
  let mockOnImageCapture: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnImageCapture = vi.fn().mockResolvedValue(undefined)

    vi.mocked(optimizeImageForAI).mockResolvedValue({
      base64: 'optimized-base64-data',
      mimeType: 'image/jpeg',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('renders Camera button', () => {
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      expect(screen.getByText('Camera')).toBeInTheDocument()
    })

    it('renders Arquivo (upload) button', () => {
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      expect(screen.getByText('Arquivo')).toBeInTheDocument()
    })

    it('shows "máx 10MB" hint', () => {
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      expect(screen.getByText(/máx 10MB/)).toBeInTheDocument()
    })

    it('buttons are not disabled by default', () => {
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const buttons = screen.getAllByRole('button')
      for (const button of buttons) {
        expect(button).not.toBeDisabled()
      }
    })

    it('buttons are disabled when disabled prop is true', () => {
      render(<ImageUploader onImageCapture={mockOnImageCapture} disabled />)

      const buttons = screen.getAllByRole('button')
      for (const button of buttons) {
        expect(button).toBeDisabled()
      }
    })
  })

  describe('10MB limit', () => {
    it('rejects oversized file and shows error', async () => {
      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const largeFile = createMockFile('large.jpg', 11 * 1024 * 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, largeFile)
      })

      expect(screen.getByText(/Imagem muito grande/)).toBeInTheDocument()
      expect(screen.getByText(/Máximo 10MB/)).toBeInTheDocument()
    })

    it('accepts file under 10MB', async () => {
      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const validFile = createMockFile('valid.jpg', 5 * 1024 * 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, validFile)
      })

      await waitFor(() => {
        expect(optimizeImageForAI).toHaveBeenCalledWith(validFile)
      })
    })

    it('accepts file exactly at 10MB', async () => {
      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const exactFile = createMockFile('exact.jpg', 10 * 1024 * 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, exactFile)
      })

      await waitFor(() => {
        expect(optimizeImageForAI).toHaveBeenCalledWith(exactFile)
      })
    })
  })

  describe('file select', () => {
    it('optimizes image and shows preview', async () => {
      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const validFile = createMockFile('test.jpg', 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, validFile)
      })

      await waitFor(() => {
        expect(optimizeImageForAI).toHaveBeenCalledWith(validFile)
      })

      await waitFor(() => {
        const preview = screen.getByRole('img', { name: 'Preview' })
        expect(preview).toBeInTheDocument()
        expect(preview).toHaveAttribute('src', 'data:image/jpeg;base64,optimized-base64-data')
      })
    })

    it('shows send button after image selected', async () => {
      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const validFile = createMockFile('test.jpg', 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, validFile)
      })

      await waitFor(() => {
        expect(screen.getByText('Enviar imagem')).toBeInTheDocument()
      })
    })

    it('falls back to original behavior when optimization fails', async () => {
      vi.mocked(optimizeImageForAI).mockRejectedValue(new Error('Optimization failed'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockFileReader = {
        onloadend: null as (() => void) | null,
        result: 'data:image/jpeg;base64,fallback-data',
        readAsDataURL: vi.fn(),
      }

      vi.spyOn(global, 'FileReader').mockImplementation(function () {
        return mockFileReader as unknown as FileReader
      })

      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const validFile = createMockFile('test.jpg', 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, validFile)
      })

      await waitFor(() => {
        expect(mockFileReader.readAsDataURL).toHaveBeenCalled()
      })

      act(() => {
        mockFileReader.onloadend?.()
      })

      await waitFor(() => {
        const preview = screen.getByRole('img', { name: 'Preview' })
        expect(preview).toHaveAttribute('src', 'data:image/jpeg;base64,fallback-data')
      })

      consoleSpy.mockRestore()
    })
  })

  describe('cancel', () => {
    it('clears preview and resets inputs', async () => {
      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const validFile = createMockFile('test.jpg', 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, validFile)
      })

      await waitFor(() => {
        expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: '' })
      await user.click(cancelButton)

      expect(screen.queryByRole('img', { name: 'Preview' })).not.toBeInTheDocument()
      expect(screen.getByText('Camera')).toBeInTheDocument()
      expect(screen.getByText('Arquivo')).toBeInTheDocument()
    })
  })

  describe('send', () => {
    it('calls onImageCapture and clears state', async () => {
      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const validFile = createMockFile('test.jpg', 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, validFile)
      })

      await waitFor(() => {
        expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument()
      })

      const sendButton = screen.getByText('Enviar imagem')
      await user.click(sendButton)

      await waitFor(() => {
        expect(mockOnImageCapture).toHaveBeenCalledWith('optimized-base64-data', 'image/jpeg')
      })

      await waitFor(() => {
        expect(screen.queryByRole('img', { name: 'Preview' })).not.toBeInTheDocument()
      })
    })

    it('shows processing spinner during send', async () => {
      let resolveCapture: (value: unknown) => void
      mockOnImageCapture.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCapture = resolve
          })
      )

      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const validFile = createMockFile('test.jpg', 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, validFile)
      })

      await waitFor(() => {
        expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument()
      })

      const sendButton = screen.getByText('Enviar imagem')
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText(/Processando imagem/)).toBeInTheDocument()
      })

      await act(async () => {
        resolveCapture!(undefined)
      })
    })
  })

  describe('camera input', () => {
    it('has capture attribute for camera', () => {
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const cameraInput = document.querySelector('input[capture="environment"]')
      expect(cameraInput).toBeInTheDocument()
    })

    it('processes camera capture same as file upload', async () => {
      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const validFile = createMockFile('camera.jpg', 1024, 'image/jpeg')

      const cameraInput = document.querySelector('input[capture="environment"]') as HTMLInputElement
      await act(async () => {
        await user.upload(cameraInput, validFile)
      })

      await waitFor(() => {
        expect(optimizeImageForAI).toHaveBeenCalledWith(validFile)
      })
    })
  })

  describe('supported formats', () => {
    it('accepts jpeg files', async () => {
      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const file = createMockFile('test.jpg', 1024, 'image/jpeg')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, file)
      })

      await waitFor(() => {
        expect(optimizeImageForAI).toHaveBeenCalled()
      })
    })

    it('accepts png files', async () => {
      vi.mocked(optimizeImageForAI).mockResolvedValue({
        base64: 'png-data',
        mimeType: 'image/jpeg',
      })

      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const file = createMockFile('test.png', 1024, 'image/png')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, file)
      })

      await waitFor(() => {
        expect(optimizeImageForAI).toHaveBeenCalled()
      })
    })

    it('accepts webp files', async () => {
      vi.mocked(optimizeImageForAI).mockResolvedValue({
        base64: 'webp-data',
        mimeType: 'image/jpeg',
      })

      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const file = createMockFile('test.webp', 1024, 'image/webp')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, file)
      })

      await waitFor(() => {
        expect(optimizeImageForAI).toHaveBeenCalled()
      })
    })

    it('accepts gif files', async () => {
      vi.mocked(optimizeImageForAI).mockResolvedValue({
        base64: 'gif-data',
        mimeType: 'image/jpeg',
      })

      const user = userEvent.setup()
      render(<ImageUploader onImageCapture={mockOnImageCapture} />)

      const file = createMockFile('test.gif', 1024, 'image/gif')

      const fileInput = document.querySelector(
        'input[type="file"]:not([capture])'
      ) as HTMLInputElement
      await act(async () => {
        await user.upload(fileInput, file)
      })

      await waitFor(() => {
        expect(optimizeImageForAI).toHaveBeenCalled()
      })
    })
  })
})
