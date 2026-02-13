import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInstallPrompt } from './use-install-prompt'

describe('useInstallPrompt', () => {
  let displayModeChangeHandler: ((event: MediaQueryListEvent) => void) | null = null
  let displayModeMatches = false
  let originalOntouchendDescriptor: PropertyDescriptor | undefined

  function createMockMatchMedia(standaloneMatches: boolean): typeof window.matchMedia {
    return vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)' ? standaloneMatches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          displayModeChangeHandler = handler
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }

  function createMockPromptEvent(): Event & {
    prompt: ReturnType<typeof vi.fn>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  } {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    return event as Event & {
      prompt: ReturnType<typeof vi.fn>
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    displayModeChangeHandler = null
    displayModeMatches = false

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMockMatchMedia(displayModeMatches),
    })

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
      writable: true,
    })

    // jsdom defines ontouchend on Document.prototype, which makes
    // 'ontouchend' in document === true. Save and remove it so tests
    // default to a non-touch environment.
    const proto = Object.getPrototypeOf(document) as Record<string, unknown>
    originalOntouchendDescriptor = Object.getOwnPropertyDescriptor(proto, 'ontouchend')
    if (originalOntouchendDescriptor) {
      Reflect.deleteProperty(proto, 'ontouchend')
    }
    if ('ontouchend' in document) {
      Reflect.deleteProperty(document, 'ontouchend')
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()

    // Restore ontouchend on Document.prototype if it was removed
    if (originalOntouchendDescriptor) {
      const proto = Object.getPrototypeOf(document) as Record<string, unknown>
      Object.defineProperty(proto, 'ontouchend', originalOntouchendDescriptor)
    }
  })

  describe('default state', () => {
    it('returns canPrompt as false initially', () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())

      expect(result.current.canPrompt).toBe(false)
    })

    it('returns isInstalled as false when not in standalone mode', () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())

      expect(result.current.isInstalled).toBe(false)
    })

    it('returns isIOS as false on non-iOS user agent', () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())

      expect(result.current.isIOS).toBe(false)
    })
  })

  describe('beforeinstallprompt event', () => {
    it('sets canPrompt to true when event fires', () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())
      const mockEvent = createMockPromptEvent()

      act(() => {
        window.dispatchEvent(mockEvent)
      })

      expect(result.current.canPrompt).toBe(true)
    })

    it('prevents default on the event', () => {
      const sut = useInstallPrompt

      renderHook(() => sut())
      const mockEvent = createMockPromptEvent()
      const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault')

      act(() => {
        window.dispatchEvent(mockEvent)
      })

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('promptInstall', () => {
    it('calls prompt() on the stored event', async () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())
      const mockEvent = createMockPromptEvent()

      act(() => {
        window.dispatchEvent(mockEvent)
      })

      await act(async () => {
        await result.current.promptInstall()
      })

      expect(mockEvent.prompt).toHaveBeenCalled()
    })

    it('resets canPrompt to false after user accepts', async () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())
      const mockEvent = createMockPromptEvent()

      act(() => {
        window.dispatchEvent(mockEvent)
      })

      expect(result.current.canPrompt).toBe(true)

      await act(async () => {
        await result.current.promptInstall()
      })

      expect(result.current.canPrompt).toBe(false)
    })

    it('keeps canPrompt true when user dismisses', async () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())
      const mockEvent = createMockPromptEvent()
      Object.assign(mockEvent, {
        userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
      })

      act(() => {
        window.dispatchEvent(mockEvent)
      })

      expect(result.current.canPrompt).toBe(true)

      await act(async () => {
        await result.current.promptInstall()
      })

      expect(result.current.canPrompt).toBe(true)
    })

    it('does nothing when no deferred prompt is available', async () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())

      await act(async () => {
        await result.current.promptInstall()
      })

      expect(result.current.canPrompt).toBe(false)
    })
  })

  describe('iOS detection', () => {
    it('returns isIOS true for iPhone user agent', () => {
      const sut = useInstallPrompt

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      })

      const { result } = renderHook(() => sut())

      expect(result.current.isIOS).toBe(true)
    })

    it('returns isIOS true for iPad user agent', () => {
      const sut = useInstallPrompt

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
        configurable: true,
      })

      const { result } = renderHook(() => sut())

      expect(result.current.isIOS).toBe(true)
    })

    it('returns isIOS true for iPod user agent', () => {
      const sut = useInstallPrompt

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      })

      const { result } = renderHook(() => sut())

      expect(result.current.isIOS).toBe(true)
    })
  })

  describe('iPadOS detection', () => {
    it('returns isIOS true when user agent has Mac and ontouchend exists', () => {
      const sut = useInstallPrompt

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        configurable: true,
      })

      // Re-add ontouchend to simulate a touch-capable device (iPadOS)
      Object.defineProperty(document, 'ontouchend', {
        value: null,
        configurable: true,
        writable: true,
      })

      const { result } = renderHook(() => sut())

      expect(result.current.isIOS).toBe(true)
    })

    it('returns isIOS false for Mac without touch support', () => {
      const sut = useInstallPrompt

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        configurable: true,
      })

      // beforeEach already removes ontouchend, so 'ontouchend' in document === false
      const { result } = renderHook(() => sut())

      expect(result.current.isIOS).toBe(false)
    })
  })

  describe('already installed', () => {
    it('returns isInstalled true when display-mode is standalone', () => {
      const sut = useInstallPrompt

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: createMockMatchMedia(true),
      })

      const { result } = renderHook(() => sut())

      expect(result.current.isInstalled).toBe(true)
    })
  })

  describe('appinstalled event', () => {
    it('sets isInstalled to true when event fires', () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())

      expect(result.current.isInstalled).toBe(false)

      act(() => {
        window.dispatchEvent(new Event('appinstalled'))
      })

      expect(result.current.isInstalled).toBe(true)
    })

    it('sets canPrompt to false when event fires', () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())
      const mockEvent = createMockPromptEvent()

      act(() => {
        window.dispatchEvent(mockEvent)
      })

      expect(result.current.canPrompt).toBe(true)

      act(() => {
        window.dispatchEvent(new Event('appinstalled'))
      })

      expect(result.current.canPrompt).toBe(false)
    })
  })

  describe('display-mode change', () => {
    it('updates isInstalled when display-mode media query changes', () => {
      const sut = useInstallPrompt

      const { result } = renderHook(() => sut())

      expect(result.current.isInstalled).toBe(false)

      act(() => {
        displayModeChangeHandler?.({ matches: true } as MediaQueryListEvent)
      })

      expect(result.current.isInstalled).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const sut = useInstallPrompt
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => sut())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))
    })

    it('removes display-mode change listener on unmount', () => {
      const sut = useInstallPrompt
      let mockRemoveEventListener: ReturnType<typeof vi.fn>

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => {
          mockRemoveEventListener = vi.fn()
          return {
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: mockRemoveEventListener,
            dispatchEvent: vi.fn(),
          }
        }),
      })

      const { unmount } = renderHook(() => sut())

      unmount()

      expect(mockRemoveEventListener!).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })
})
