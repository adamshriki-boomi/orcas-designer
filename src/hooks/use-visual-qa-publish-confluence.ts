'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export interface PublishArgs {
  reportId: string
  spaceKey: string
  parentPageId?: string
}

export interface PublishResult {
  pageId: string
  pageUrl: string
}

export function useVisualQaPublishConfluence() {
  const { user } = useAuth()
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const publish = useCallback(
    async (args: PublishArgs): Promise<PublishResult> => {
      if (!user) throw new Error('Not authenticated')
      setPublishing(true)
      setError(null)
      try {
        const body: Record<string, unknown> = {
          reportId: args.reportId,
          spaceKey: args.spaceKey,
        }
        if (args.parentPageId) body.parentPageId = args.parentPageId

        const supabase = createClient()
        const { data, error: fnError } = await supabase.functions.invoke(
          'visual-qa-publish-confluence',
          { body }
        )
        if (fnError) {
          const msg = fnError.message ?? 'Publish to Confluence failed'
          setError(msg)
          throw new Error(msg)
        }
        const payload = (data ?? null) as (PublishResult & { error?: string }) | null
        if (payload?.error) {
          setError(payload.error)
          throw new Error(payload.error)
        }
        if (!payload?.pageId || !payload?.pageUrl) {
          const msg = 'Publish response missing pageId or pageUrl'
          setError(msg)
          throw new Error(msg)
        }
        return { pageId: payload.pageId, pageUrl: payload.pageUrl }
      } finally {
        setPublishing(false)
      }
    },
    [user]
  )

  return { publish, publishing, error }
}
