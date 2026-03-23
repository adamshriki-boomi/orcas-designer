import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from './use-copy-to-clipboard'

describe('useCopyToClipboard', () => {
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    Object.assign(navigator, { clipboard: originalClipboard })
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('initial state has copied as false', () => {
    const { result } = renderHook(() => useCopyToClipboard())

    expect(result.current.copied).toBe(false)
  })

  it('successful copy sets copied to true and returns true', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    let returnValue: boolean | undefined
    await act(async () => {
      returnValue = await result.current.copy('hello world')
    })

    expect(returnValue).toBe(true)
    expect(result.current.copied).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world')
  })

  it('copied resets to false after 2000ms timeout', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('text')
    })
    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.copied).toBe(false)
  })

  it('failed copy returns false and copied stays false', async () => {
    ;(navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Clipboard access denied')
    )
    const { result } = renderHook(() => useCopyToClipboard())

    let returnValue: boolean | undefined
    await act(async () => {
      returnValue = await result.current.copy('text')
    })

    expect(returnValue).toBe(false)
    expect(result.current.copied).toBe(false)
  })
})
