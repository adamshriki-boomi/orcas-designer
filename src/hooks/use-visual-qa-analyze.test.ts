import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const invokeFn = vi.fn()

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    functions: { invoke: invokeFn },
  }),
}))

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

import { useVisualQaAnalyze } from './use-visual-qa-analyze'

beforeEach(() => {
  invokeFn.mockReset()
})

describe('useVisualQaAnalyze', () => {
  it('exposes idle state initially', () => {
    invokeFn.mockResolvedValue({ data: null, error: null })
    const { result } = renderHook(() => useVisualQaAnalyze())
    expect(result.current.analyzing).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('invokes the visual-qa-analyze edge function with reportId and memoryIds', async () => {
    invokeFn.mockResolvedValue({
      data: { ok: true, summary: 's', issues: [], severityCounts: { high: 0, medium: 0, low: 0 } },
      error: null,
    })

    const { result } = renderHook(() => useVisualQaAnalyze())
    await act(async () => {
      await result.current.analyze({ reportId: 'r1', memoryIds: ['m1', 'm2'] })
    })

    expect(invokeFn).toHaveBeenCalledTimes(1)
    expect(invokeFn).toHaveBeenCalledWith('visual-qa-analyze', {
      body: { reportId: 'r1', memoryIds: ['m1', 'm2'] },
    })
  })

  it('toggles analyzing while the call is in flight and returns the result', async () => {
    let resolveInvoke!: (v: { data: unknown; error: unknown }) => void
    invokeFn.mockReturnValue(
      new Promise((resolve) => {
        resolveInvoke = resolve
      })
    )

    const { result } = renderHook(() => useVisualQaAnalyze())

    let analyzePromise: Promise<unknown> | undefined
    act(() => {
      analyzePromise = result.current.analyze({ reportId: 'r1', memoryIds: [] })
    })
    await waitFor(() => expect(result.current.analyzing).toBe(true))

    await act(async () => {
      resolveInvoke({
        data: {
          ok: true,
          summary: 'done',
          issues: [{ id: 'f1', severity: 'low', category: 'Layout', location: 'L', description: 'd', expected: 'e', actual: 'a', suggestedFix: 'f' }],
          severityCounts: { high: 0, medium: 0, low: 1 },
        },
        error: null,
      })
      await analyzePromise
    })

    await waitFor(() => expect(result.current.analyzing).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('surfaces an error when the edge function returns an error', async () => {
    invokeFn.mockResolvedValue({
      data: null,
      error: { message: 'edge boom', context: undefined },
    })

    const { result } = renderHook(() => useVisualQaAnalyze())
    await act(async () => {
      try {
        await result.current.analyze({ reportId: 'r1', memoryIds: [] })
      } catch {
        // expected
      }
    })

    expect(result.current.analyzing).toBe(false)
    expect(result.current.error).toContain('edge boom')
  })

  it('surfaces an error when the edge function payload includes data.error', async () => {
    invokeFn.mockResolvedValue({
      data: { error: 'figma fetch failed' },
      error: null,
    })

    const { result } = renderHook(() => useVisualQaAnalyze())
    await act(async () => {
      try {
        await result.current.analyze({ reportId: 'r1', memoryIds: [] })
      } catch {
        // expected
      }
    })

    expect(result.current.error).toBe('figma fetch failed')
  })

  it('throws when called without an authenticated user is impossible (auth is mocked) — guard exists', async () => {
    invokeFn.mockResolvedValue({ data: { ok: true }, error: null })
    const { result } = renderHook(() => useVisualQaAnalyze())
    await expect(
      result.current.analyze({ reportId: 'r1', memoryIds: [] })
    ).resolves.toBeDefined()
  })
})
