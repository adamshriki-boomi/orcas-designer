'use client'

import type { ChangeEvent } from 'react'
import {
  VISUAL_QA_CATEGORIES,
  type VisualQaCategory,
  type VisualQaFinding,
  type VisualQaSeverity,
} from '@/lib/types'

const SEVERITIES: readonly VisualQaSeverity[] = ['high', 'medium', 'low']

const SEVERITY_BG: Record<VisualQaSeverity, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-orange-100 text-orange-800',
  low: 'bg-yellow-100 text-yellow-800',
}

interface FindingCardProps {
  finding: VisualQaFinding
  onChange: (patch: Partial<VisualQaFinding>) => void
  onDelete: () => void
}

export function FindingCard({ finding, onChange, onDelete }: FindingCardProps) {
  const fieldId = (k: string) => `${finding.id}-${k}`

  return (
    <article
      role="group"
      aria-label={finding.location || 'Finding'}
      className="rounded border border-[var(--exo-color-border-default,#e2e8f0)] bg-white p-3"
    >
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_BG[finding.severity]}`}
        >
          {capitalize(finding.severity)}
        </span>

        <label className="flex items-center gap-1 text-xs">
          <span className="sr-only">Severity</span>
          <select
            id={fieldId('severity')}
            aria-label="Severity"
            value={finding.severity}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onChange({ severity: e.target.value as VisualQaSeverity })
            }
            className="rounded border border-gray-300 px-1 py-0.5 text-xs"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {capitalize(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1 text-xs">
          <span className="sr-only">Category</span>
          <select
            id={fieldId('category')}
            aria-label="Category"
            value={finding.category}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onChange({ category: e.target.value as VisualQaCategory })
            }
            className="rounded border border-gray-300 px-1 py-0.5 text-xs"
          >
            {VISUAL_QA_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1 text-xs">
          <span className="text-gray-500">Exosphere component</span>
          <input
            id={fieldId('component')}
            aria-label="Exosphere component"
            value={finding.exosphereComponent ?? ''}
            placeholder="e.g. ExButton"
            onChange={(e) =>
              onChange({
                exosphereComponent: e.target.value.trim() ? e.target.value : undefined,
              })
            }
            className="rounded border border-gray-300 px-1 py-0.5 text-xs"
          />
        </label>

        <button
          type="button"
          onClick={onDelete}
          className="ml-auto cursor-pointer rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </header>

      <Field
        id={fieldId('location')}
        label="Location"
        value={finding.location}
        onChange={(v) => onChange({ location: v })}
        rows={1}
      />
      <Field
        id={fieldId('description')}
        label="Description"
        value={finding.description}
        onChange={(v) => onChange({ description: v })}
        rows={2}
      />
      <Field
        id={fieldId('expected')}
        label="Expected"
        value={finding.expected}
        onChange={(v) => onChange({ expected: v })}
        rows={2}
      />
      <Field
        id={fieldId('actual')}
        label="Actual"
        value={finding.actual}
        onChange={(v) => onChange({ actual: v })}
        rows={2}
      />
      <Field
        id={fieldId('suggestedFix')}
        label="Suggested fix"
        value={finding.suggestedFix}
        onChange={(v) => onChange({ suggestedFix: v })}
        rows={2}
      />
    </article>
  )
}

interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  rows: number
}

function Field({ id, label, value, onChange, rows }: FieldProps) {
  return (
    <div className="mb-2 flex flex-col gap-0.5">
      <label htmlFor={id} className="text-xs font-medium text-gray-600">
        {label}
      </label>
      {rows > 1 ? (
        <textarea
          id={id}
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      )}
    </div>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
