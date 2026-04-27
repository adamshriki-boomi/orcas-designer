'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export interface AnalyzeArgs {
  reportId: string
  memoryIds: string[]
}

export interface AnalyzeResult {
  ok: boolean
  summary?: string
  issues?: unknown[]
  severityCounts?: { high: number; medium: number; low: number }
  error?: string
}

export function useVisualQaAnalyze() {
  const { user } = useAuth()
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(
    async (args: AnalyzeArgs): Promise<AnalyzeResult> => {
      if (!user) throw new Error('Not authenticated')
      setAnalyzing(true)
      setError(null)
      try {
        const supabase = createClient()
        const { data, error: fnError } = await supabase.functions.invoke(
          'visual-qa-analyze',
          { body: { reportId: args.reportId, memoryIds: args.memoryIds } }
        )
        if (fnError) {
          const msg = await readEdgeFunctionError(fnError)
          setError(msg)
          throw new Error(msg)
        }
        const payload = (data ?? null) as AnalyzeResult | null
        if (payload?.error) {
          setError(payload.error)
          throw new Error(payload.error)
        }
        return payload ?? { ok: true }
      } finally {
        setAnalyzing(false)
      }
    },
    [user]
  )

  return { analyze, analyzing, error }
}

interface EdgeFnError {
  message?: string
  context?: unknown
}

async function readEdgeFunctionError(err: EdgeFnError): Promise<string> {
  const fallback = err.message ?? 'Visual QA analysis failed'
  try {
    if (err.context instanceof Response) {
      const body = await err.context.json()
      return (body && typeof body.error === 'string' ? body.error : null) ?? fallback
    }
  } catch {
    // fall through
  }
  return fallback
}
