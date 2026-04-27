'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type {
  VisualQaDesignSource,
  VisualQaIssue,
  VisualQaReport,
  VisualQaSeverityCounts,
  VisualQaStatus,
} from '@/lib/types'

export function toVisualQaReport(row: Record<string, unknown>): VisualQaReport {
  // Read from `issues` (current column) and fall back to `findings` (pre-rename).
  // This keeps existing rows visible on local databases that haven't yet run the
  // 20260428000000_rename_findings_to_issues.sql migration. Once the migration
  // has been applied, the legacy fallback is a no-op.
  const issuesRaw = (row.issues ?? row.findings) as VisualQaIssue[] | null | undefined
  return {
    id: row.id as string,
    userId: row.user_id as string,
    projectId: (row.project_id as string | null) ?? null,
    title: row.title as string,
    designSource: row.design_source as VisualQaDesignSource,
    designImageUrl: (row.design_image_url as string) ?? '',
    designFigmaUrl: (row.design_figma_url as string | null) ?? null,
    implImageUrl: (row.impl_image_url as string) ?? '',
    status: (row.status as VisualQaStatus) ?? 'pending',
    issues: issuesRaw ?? [],
    summary: (row.summary as string | null) ?? null,
    severityCounts:
      (row.severity_counts as VisualQaSeverityCounts | null) ?? { high: 0, medium: 0, low: 0 },
    memoryIds: (row.memory_ids as string[] | null) ?? [],
    confluencePageId: (row.confluence_page_id as string | null) ?? null,
    confluencePageUrl: (row.confluence_page_url as string | null) ?? null,
    error: (row.error as string | null) ?? null,
    createdAt: (row.created_at as string) ?? '',
    updatedAt: (row.updated_at as string) ?? '',
  }
}

export interface CreateReportInput {
  title: string
  designSource: VisualQaDesignSource
  designImageUrl: string
  designFigmaUrl: string | null
  implImageUrl: string
  memoryIds: string[]
  projectId: string | null
}

export type ReportPatch = Partial<
  Pick<VisualQaReport, 'title' | 'issues' | 'summary' | 'severityCounts'>
>

export function useVisualQaReports() {
  const { user } = useAuth()
  const [reports, setReports] = useState<VisualQaReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('visual_qa_reports')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      setReports(data.map(toVisualQaReport))
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (user) fetchReports()
  }, [user, fetchReports])

  const createReport = useCallback(
    async (input: CreateReportInput): Promise<string> => {
      if (!user) throw new Error('Not authenticated')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('visual_qa_reports')
        .insert({
          user_id: user.id,
          project_id: input.projectId,
          title: input.title,
          design_source: input.designSource,
          design_image_url: input.designImageUrl,
          design_figma_url: input.designFigmaUrl,
          impl_image_url: input.implImageUrl,
          status: 'pending',
          memory_ids: input.memoryIds,
        })
        .select('id')
        .single()
      if (error) throw error
      await fetchReports()
      return data.id as string
    },
    [user, fetchReports]
  )

  const updateReport = useCallback(
    async (id: string, patch: ReportPatch): Promise<void> => {
      const supabase = createClient()
      const mapped: Record<string, unknown> = {}
      if (patch.title !== undefined) mapped.title = patch.title
      if (patch.issues !== undefined) mapped.issues = patch.issues
      if (patch.summary !== undefined) mapped.summary = patch.summary
      if (patch.severityCounts !== undefined) mapped.severity_counts = patch.severityCounts

      const { error } = await supabase
        .from('visual_qa_reports')
        .update(mapped as never)
        .eq('id', id)
      if (error) throw error
      await fetchReports()
    },
    [fetchReports]
  )

  const deleteReport = useCallback(
    async (id: string): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.from('visual_qa_reports').delete().eq('id', id)
      if (error) throw error
      await fetchReports()
    },
    [fetchReports]
  )

  const getReport = useCallback(async (id: string): Promise<VisualQaReport | null> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('visual_qa_reports')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    return toVisualQaReport(data)
  }, [])

  return { reports, isLoading, createReport, updateReport, deleteReport, getReport }
}
