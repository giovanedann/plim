import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VoiceRecorder } from './voice-recorder'

type MockMediaRecorder = {
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  ondataavailable: ((event: { data: Blob }) => void) | null
  onstop: (() => void) | null
}

function createMockMediaRecorder(): MockMediaRecorder {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    ondataavailable: null,
    onstop: null,
  }
}

function createMockStream(): MediaStream {
  return {
    getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
  } as unknown as MediaStream
}

describe('VoiceRecorder', () => {
  let mockMediaRecorder: MockMediaRecorder
  let mockStream: MediaStream
  let mockOnRecordingComplete: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockMediaRecorder = createMockMediaRecorder()
    mockStream = createMockStream()
    mockOnRecordingComplete = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(global, 'MediaRecorder', {
      writable: true,
      value: vi.fn().mockImplementation(function () {
        return mockMediaRecorder
      }),
    })

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('renders mic button', () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('shows "máx 10s" hint', () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      expect(screen.getByText(/máx 10s/)).toBeInTheDocument()
    })

    it('button is not disabled by default', () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
    })

    it('button is disabled when disabled prop is true', () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} disabled />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('recording', () => {
    it('starts recording on button click', async () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
      expect(mockMediaRecorder.start).toHaveBeenCalled()
    })

    it('shows duration while recording', async () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      expect(screen.getByText(/Gravando/)).toBeInTheDocument()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })

      expect(screen.getByText('Gravando... 0:01')).toBeInTheDocument()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      expect(screen.getByText('Gravando... 0:03')).toBeInTheDocument()
    })

    it('changes button to stop variant while recording', async () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      expect(button).toHaveClass('bg-destructive')
    })
  })

  describe('10 second limit', () => {
    it('auto-stops at 10 seconds', async () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000)
      })

      expect(mockMediaRecorder.stop).toHaveBeenCalled()
    })

    it('shows warning at 7 seconds ("Xs restantes")', async () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(7000)
      })

      expect(screen.getByText('3s restantes')).toBeInTheDocument()
    })

    it('shows 2s restantes at 8 seconds', async () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(8000)
      })

      expect(screen.getByText('2s restantes')).toBeInTheDocument()
    })

    it('shows 1s restantes at 9 seconds', async () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(9000)
      })

      expect(screen.getByText('1s restantes')).toBeInTheDocument()
    })

    it('warning text has orange color', async () => {
      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(7000)
      })

      const warningText = screen.getByText('3s restantes')
      expect(warningText).toHaveClass('text-orange-500')
    })
  })

  describe('manual stop', () => {
    it('stops recording and calls onRecordingComplete', async () => {
      const mockFileReader = {
        onloadend: null as (() => void) | null,
        result: 'data:audio/webm;base64,dGVzdA==',
        readAsDataURL: vi.fn(),
      }

      vi.spyOn(global, 'FileReader').mockImplementation(function () {
        return mockFileReader as unknown as FileReader
      })

      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000)
      })

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      expect(mockMediaRecorder.stop).toHaveBeenCalled()

      await act(async () => {
        mockMediaRecorder.ondataavailable?.({ data: new Blob(['test'], { type: 'audio/webm' }) })
        mockMediaRecorder.onstop?.()
        await vi.advanceTimersByTimeAsync(100)
      })

      await act(async () => {
        mockFileReader.onloadend?.()
        await vi.advanceTimersByTimeAsync(100)
      })

      expect(mockOnRecordingComplete).toHaveBeenCalledWith('dGVzdA==', 'audio/webm')
    })
  })

  describe('processing state', () => {
    it('shows spinner during conversion', async () => {
      const mockFileReader = {
        onloadend: null as (() => void) | null,
        result: 'data:audio/webm;base64,dGVzdA==',
        readAsDataURL: vi.fn(),
      }

      vi.spyOn(global, 'FileReader').mockImplementation(function () {
        return mockFileReader as unknown as FileReader
      })

      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      act(() => {
        mockMediaRecorder.ondataavailable?.({ data: new Blob(['test'], { type: 'audio/webm' }) })
        mockMediaRecorder.onstop?.()
      })

      expect(screen.getByText(/Processando audio/)).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('logs error when getUserMedia fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
        new Error('Permission denied')
      )

      render(<VoiceRecorder onRecordingComplete={mockOnRecordingComplete} />)

      const button = screen.getByRole('button')

      await act(async () => {
        button.click()
        await vi.advanceTimersByTimeAsync(100)
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to start recording:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
})
