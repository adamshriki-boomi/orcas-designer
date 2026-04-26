'use client'

import {
  VISUAL_QA_CATEGORIES,
  type VisualQaCategory,
  type VisualQaFinding,
} from '@/lib/types'
import { FindingCard } from './finding-card'

interface FindingsListProps {
  findings: VisualQaFinding[]
  onChange: (next: VisualQaFinding[]) => void
}

export function FindingsList({ findings, onChange }: FindingsListProps) {
  if (findings.length === 0) {
    return <p className="text-sm text-gray-600">No findings yet.</p>
  }

  const grouped = groupByCategory(findings)

  const patchAt = (idx: number, patch: Partial<VisualQaFinding>) => {
    onChange(findings.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }
  const removeAt = (idx: number) => {
    onChange(findings.filter((_, i) => i !== idx))
  }
  const addInCategory = (category: VisualQaCategory) => {
    onChange([
      ...findings,
      {
        id: generateId(),
        severity: 'medium',
        category,
        location: '',
        description: '',
        expected: '',
        actual: '',
        suggestedFix: '',
      },
    ])
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <section
          key={category}
          aria-label={category}
          className="rounded border border-[var(--exo-color-border-default,#e2e8f0)] bg-gray-50 p-3"
        >
          <header className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">{category}</h2>
            <button
              type="button"
              onClick={() => addInCategory(category)}
              className="cursor-pointer rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50"
            >
              Add finding
            </button>
          </header>
          <div className="flex flex-col gap-2">
            {items.map(({ finding, originalIndex }) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onChange={(patch) => patchAt(originalIndex, patch)}
                onDelete={() => removeAt(originalIndex)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

interface IndexedFinding {
  finding: VisualQaFinding
  originalIndex: number
}

function groupByCategory(
  findings: VisualQaFinding[]
): Map<VisualQaCategory, IndexedFinding[]> {
  const map = new Map<VisualQaCategory, IndexedFinding[]>()
  for (const cat of VISUAL_QA_CATEGORIES) {
    // Pre-seed nothing — only categories with findings show.
    void cat
  }
  findings.forEach((finding, originalIndex) => {
    const list = map.get(finding.category) ?? []
    list.push({ finding, originalIndex })
    map.set(finding.category, list)
  })
  return map
}

function generateId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}
