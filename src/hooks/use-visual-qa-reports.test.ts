import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { clearAllTables, createMockSupabaseClient } from '@/test/helpers/supabase-mock'

const mockClient = createMockSupabaseClient()

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

import { useVisualQaReports, toVisualQaReport } from './use-visual-qa-reports'

beforeEach(() => {
  clearAllTables()
})

describe('toVisualQaReport', () => {
  it('maps a snake_case row to a VisualQaReport', () => {
    const row = {
      id: 'r1',
      user_id: 'u1',
      project_id: null,
      title: 'Onboarding step 2',
      design_source: 'figma',
      design_image_url: 'https://x/design.png',
      design_figma_url: 'https://figma.com/design/abc?node-id=1-2',
      impl_image_url: 'https://x/impl.png',
      status: 'complete',
      summary: 'Looks close',
      severity_counts: { high: 1, medium: 2, low: 0 },
      memory_ids: ['m1'],
      confluence_page_id: null,
      confluence_page_url: null,
      error: null,
      findings: [
        {
          id: 'f1',
          severity: 'high',
          category: 'Layout',
          location: 'Header',
          description: 'd',
          expected: 'e',
          actual: 'a',
          suggestedFix: 'f',
        },
      ],
      created_at: '2026-04-26T10:00:00Z',
      updated_at: '2026-04-26T11:00:00Z',
    }

    const out = toVisualQaReport(row)
    expect(out.id).toBe('r1')
    expect(out.userId).toBe('u1')
    expect(out.projectId).toBeNull()
    expect(out.title).toBe('Onboarding step 2')
    expect(out.designSource).toBe('figma')
    expect(out.designImageUrl).toBe('https://x/design.png')
    expect(out.designFigmaUrl).toBe('https://figma.com/design/abc?node-id=1-2')
    expect(out.implImageUrl).toBe('https://x/impl.png')
    expect(out.status).toBe('complete')
    expect(out.summary).toBe('Looks close')
    expect(out.severityCounts).toEqual({ high: 1, medium: 2, low: 0 })
    expect(out.memoryIds).toEqual(['m1'])
    expect(out.findings).toHaveLength(1)
    expect(out.findings[0].id).toBe('f1')
    expect(out.createdAt).toBe('2026-04-26T10:00:00Z')
    expect(out.updatedAt).toBe('2026-04-26T11:00:00Z')
  })

  it('defaults missing optional fields to safe values', () => {
    const out = toVisualQaReport({
      id: 'r2',
      user_id: 'u1',
      title: 'X',
      design_source: 'upload',
      design_image_url: '',
      impl_image_url: '',
      status: 'pending',
      created_at: '',
      updated_at: '',
    })
    expect(out.findings).toEqual([])
    expect(out.severityCounts).toEqual({ high: 0, medium: 0, low: 0 })
    expect(out.memoryIds).toEqual([])
    expect(out.summary).toBeNull()
    expect(out.designFigmaUrl).toBeNull()
    expect(out.confluencePageId).toBeNull()
    expect(out.confluencePageUrl).toBeNull()
  })
})

describe('visual_qa_reports Supabase operations', () => {
  it('orders rows by created_at descending', async () => {
    await mockClient.from('visual_qa_reports').insert({
      id: 'r-old', user_id: 'user-1', title: 'Old', design_source: 'upload',
      design_image_url: 'd', impl_image_url: 'i', status: 'complete',
      created_at: '2026-01-01T00:00:00Z',
    })
    await mockClient.from('visual_qa_reports').insert({
      id: 'r-new', user_id: 'user-1', title: 'New', design_source: 'upload',
      design_image_url: 'd', impl_image_url: 'i', status: 'complete',
      created_at: '2026-04-01T00:00:00Z',
    })

    const { data } = await mockClient
      .from('visual_qa_reports')
      .select('*')
      .order('created_at', { ascending: false })

    expect(data![0].id).toBe('r-new')
    expect(data![1].id).toBe('r-old')
  })

  it('filters reports by user_id', async () => {
    await mockClient.from('visual_qa_reports').insert({
      id: 'a', user_id: 'user-1', title: 'A', design_source: 'upload',
      design_image_url: 'd', impl_image_url: 'i', status: 'complete',
    })
    await mockClient.from('visual_qa_reports').insert({
      id: 'b', user_id: 'user-2', title: 'B', design_source: 'upload',
      design_image_url: 'd', impl_image_url: 'i', status: 'complete',
    })

    const { data } = await mockClient
      .from('visual_qa_reports')
      .select('*')
      .eq('user_id', 'user-1')

    expect(data).toHaveLength(1)
    expect(data![0].id).toBe('a')
  })

  it('updates a report row in place', async () => {
    await mockClient.from('visual_qa_reports').insert({
      id: 'edit-me', user_id: 'user-1', title: 'Before', design_source: 'upload',
      design_image_url: 'd', impl_image_url: 'i', status: 'complete',
      findings: [],
    })

    await mockClient.from('visual_qa_reports').update({
      title: 'After',
      findings: [{ id: 'f', severity: 'low', category: 'Layout', location: 'L', description: 'd', expected: 'e', actual: 'a', suggestedFix: 'f' }],
    }).eq('id', 'edit-me')

    const { data } = await mockClient
      .from('visual_qa_reports')
      .select('*')
      .eq('id', 'edit-me')
      .single()

    expect(data!.title).toBe('After')
    expect((data!.findings as unknown[]).length).toBe(1)
  })

  it('deletes a report by id', async () => {
    await mockClient.from('visual_qa_reports').insert({
      id: 'goodbye', user_id: 'user-1', title: 'Goodbye', design_source: 'upload',
      design_image_url: 'd', impl_image_url: 'i', status: 'complete',
    })

    await mockClient.from('visual_qa_reports').delete().eq('id', 'goodbye')

    const { data } = await mockClient.from('visual_qa_reports').select('*')
    expect(data).toHaveLength(0)
  })
})

describe('useVisualQaReports hook', () => {
  it('loads existing reports for the user and marks isLoading false', async () => {
    await mockClient.from('visual_qa_reports').insert({
      id: 'r1', user_id: 'user-1', title: 'My report', design_source: 'upload',
      design_image_url: 'd', impl_image_url: 'i', status: 'complete',
      created_at: '2026-04-26T10:00:00Z', updated_at: '2026-04-26T10:00:00Z',
    })

    const { result } = renderHook(() => useVisualQaReports())
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 2000 })

    expect(result.current.reports).toHaveLength(1)
    expect(result.current.reports[0].title).toBe('My report')
  })

  it('createReport inserts a row and returns the new id', async () => {
    const { result } = renderHook(() => useVisualQaReports())
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 2000 })

    const id = await result.current.createReport({
      title: 'Fresh',
      designSource: 'upload',
      designImageUrl: 'd-url',
      designFigmaUrl: null,
      implImageUrl: 'i-url',
      memoryIds: ['m1', 'm2'],
      projectId: null,
    })
    expect(id).toBeTruthy()

    await waitFor(
      () => expect(result.current.reports.some((r) => r.title === 'Fresh')).toBe(true),
      { timeout: 2000 },
    )
  })

  it('updateReport mutates the row and refreshes the list', async () => {
    await mockClient.from('visual_qa_reports').insert({
      id: 'mut-1', user_id: 'user-1', title: 'Before', design_source: 'upload',
      design_image_url: 'd', impl_image_url: 'i', status: 'complete',
    })

    const { result } = renderHook(() => useVisualQaReports())
    await waitFor(() =>
      expect(result.current.reports.some((r) => r.id === 'mut-1')).toBe(true),
    )

    await result.current.updateReport('mut-1', { title: 'After' })

    await waitFor(() => {
      const row = result.current.reports.find((r) => r.id === 'mut-1')
      expect(row?.title).toBe('After')
    }, { timeout: 2000 })
  })

  it('deleteReport removes the row', async () => {
    await mockClient.from('visual_qa_reports').insert({
      id: 'del-1', user_id: 'user-1', title: 'Bye', design_source: 'upload',
      design_image_url: 'd', impl_image_url: 'i', status: 'complete',
    })

    const { result } = renderHook(() => useVisualQaReports())
    await waitFor(() =>
      expect(result.current.reports.some((r) => r.id === 'del-1')).toBe(true),
    )

    await result.current.deleteReport('del-1')

    await waitFor(
      () => expect(result.current.reports.some((r) => r.id === 'del-1')).toBe(false),
      { timeout: 2000 },
    )
  })

  it('getReport fetches a single report by id', async () => {
    await mockClient.from('visual_qa_reports').insert({
      id: 'get-1', user_id: 'user-1', title: 'Detailed', design_source: 'figma',
      design_image_url: 'd', design_figma_url: 'https://figma.com/design/x?node-id=1-2',
      impl_image_url: 'i', status: 'complete',
      summary: 'A thorough QA',
      findings: [
        { id: 'f1', severity: 'high', category: 'Component', location: 'CTA', description: 'wrong button', expected: 'primary', actual: 'tertiary', suggestedFix: 'use primary' },
      ],
      severity_counts: { high: 1, medium: 0, low: 0 },
    })

    const { result } = renderHook(() => useVisualQaReports())
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 2000 })

    const report = await result.current.getReport('get-1')
    expect(report).not.toBeNull()
    expect(report!.title).toBe('Detailed')
    expect(report!.designFigmaUrl).toBe('https://figma.com/design/x?node-id=1-2')
    expect(report!.findings).toHaveLength(1)
    expect(report!.severityCounts).toEqual({ high: 1, medium: 0, low: 0 })
  })

  it('getReport returns null when not found', async () => {
    const { result } = renderHook(() => useVisualQaReports())
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 2000 })

    const report = await result.current.getReport('does-not-exist')
    expect(report).toBeNull()
  })
})
