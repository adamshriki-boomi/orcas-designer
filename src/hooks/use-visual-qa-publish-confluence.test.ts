import { renderHook, act } from '@testing-library/react'
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

import { useVisualQaPublishConfluence } from './use-visual-qa-publish-confluence'

beforeEach(() => {
  invokeFn.mockReset()
})

describe('useVisualQaPublishConfluence', () => {
  it('exposes idle state initially', () => {
    invokeFn.mockResolvedValue({ data: null, error: null })
    const { result } = renderHook(() => useVisualQaPublishConfluence())
    expect(result.current.publishing).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('invokes the publish edge function with the report id and space key', async () => {
    invokeFn.mockResolvedValue({
      data: { pageId: '12345', pageUrl: 'https://confluence.example.com/x/12345' },
      error: null,
    })

    const { result } = renderHook(() => useVisualQaPublishConfluence())
    let publishResult: { pageId: string; pageUrl: string } | undefined
    await act(async () => {
      publishResult = await result.current.publish({ reportId: 'r1', spaceKey: 'DESIGN' })
    })

    expect(invokeFn).toHaveBeenCalledWith('visual-qa-publish-confluence', {
      body: { reportId: 'r1', spaceKey: 'DESIGN' },
    })
    expect(publishResult).toEqual({ pageId: '12345', pageUrl: 'https://confluence.example.com/x/12345' })
  })

  it('forwards an optional parentPageId', async () => {
    invokeFn.mockResolvedValue({
      data: { pageId: '1', pageUrl: 'https://x' },
      error: null,
    })
    const { result } = renderHook(() => useVisualQaPublishConfluence())
    await act(async () => {
      await result.current.publish({ reportId: 'r1', spaceKey: 'DESIGN', parentPageId: '999' })
    })
    expect(invokeFn).toHaveBeenCalledWith('visual-qa-publish-confluence', {
      body: { reportId: 'r1', spaceKey: 'DESIGN', parentPageId: '999' },
    })
  })

  it('surfaces the edge function error message', async () => {
    invokeFn.mockResolvedValue({
      data: null,
      error: { message: 'Confluence credentials missing' },
    })
    const { result } = renderHook(() => useVisualQaPublishConfluence())
    await act(async () => {
      try {
        await result.current.publish({ reportId: 'r1', spaceKey: 'DESIGN' })
      } catch {
        // expected
      }
    })
    expect(result.current.error).toContain('Confluence credentials missing')
    expect(result.current.publishing).toBe(false)
  })

  it('surfaces a payload-level error from the edge function', async () => {
    invokeFn.mockResolvedValue({
      data: { error: 'space DESIGN does not exist' },
      error: null,
    })
    const { result } = renderHook(() => useVisualQaPublishConfluence())
    await act(async () => {
      try {
        await result.current.publish({ reportId: 'r1', spaceKey: 'DESIGN' })
      } catch {
        // expected
      }
    })
    expect(result.current.error).toBe('space DESIGN does not exist')
  })
})
