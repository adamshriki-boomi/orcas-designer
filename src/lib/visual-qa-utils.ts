import {
  VISUAL_QA_CATEGORIES,
  type VisualQaCategory,
  type VisualQaIssue,
  type VisualQaSeverity,
  type VisualQaSeverityCounts,
} from './types'

const generateIssueId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

const SEVERITIES: ReadonlySet<VisualQaSeverity> = new Set(['low', 'medium', 'high'])
const CATEGORIES: ReadonlySet<string> = new Set(VISUAL_QA_CATEGORIES)

export function computeSeverityCounts(
  issues: readonly VisualQaIssue[]
): VisualQaSeverityCounts {
  const counts: VisualQaSeverityCounts = { high: 0, medium: 0, low: 0 }
  for (const f of issues) {
    if (f.severity === 'high' || f.severity === 'medium' || f.severity === 'low') {
      counts[f.severity] += 1
    }
  }
  return counts
}

export function assignIssueIds(issues: readonly VisualQaIssue[]): VisualQaIssue[] {
  return issues.map((f) => (f.id ? f : { ...f, id: generateIssueId() }))
}

export interface VisualQaAiResponse {
  summary: string
  issues: VisualQaIssue[]
}

export function normalizeAiResponse(raw: unknown): VisualQaAiResponse {
  const parsed = coerceToObject(raw)

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('AI response is not an object')
  }
  const obj = parsed as Record<string, unknown>

  const summary = obj.summary
  if (typeof summary !== 'string') {
    throw new Error('AI response is missing a string "summary"')
  }

  const issues = obj.issues
  if (!Array.isArray(issues)) {
    throw new Error('AI response is missing a "issues" array')
  }

  const normalized: VisualQaIssue[] = issues.map((entry, idx) =>
    normalizeIssue(entry, idx)
  )

  return { summary, issues: normalized }
}

function coerceToObject(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  const stripped = stripCodeFences(raw).trim()
  if (!stripped) throw new Error('AI response is empty')

  try {
    return JSON.parse(stripped)
  } catch {
    // Try to extract a JSON object from prose-prefixed text.
    const start = stripped.indexOf('{')
    const end = stripped.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('AI response is not valid JSON')
    }
    return JSON.parse(stripped.slice(start, end + 1))
  }
}

function stripCodeFences(text: string): string {
  const fenced = /^```(?:json|JSON)?\s*\n([\s\S]*?)\n```\s*$/m.exec(text.trim())
  return fenced ? fenced[1] : text
}

function normalizeIssue(entry: unknown, idx: number): VisualQaIssue {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error(`Issue #${idx} is not an object`)
  }
  const f = entry as Record<string, unknown>

  const rawSeverity = typeof f.severity === 'string' ? f.severity.toLowerCase() : ''
  if (!SEVERITIES.has(rawSeverity as VisualQaSeverity)) {
    throw new Error(`Issue #${idx} has unknown severity: ${String(f.severity)}`)
  }
  const severity = rawSeverity as VisualQaSeverity

  const category = typeof f.category === 'string' ? f.category : ''
  if (!CATEGORIES.has(category)) {
    throw new Error(`Issue #${idx} has unknown category: ${String(f.category)}`)
  }

  const requireString = (key: string): string => {
    const v = f[key]
    if (typeof v !== 'string') {
      throw new Error(`Issue #${idx} is missing required string "${key}"`)
    }
    return v
  }

  const out: VisualQaIssue = {
    id: typeof f.id === 'string' ? f.id : '',
    severity,
    category: category as VisualQaCategory,
    location: requireString('location'),
    description: requireString('description'),
    expected: requireString('expected'),
    actual: requireString('actual'),
    suggestedFix: requireString('suggestedFix'),
  }

  if (typeof f.exosphereComponent === 'string' && f.exosphereComponent.trim()) {
    out.exosphereComponent = f.exosphereComponent.trim()
  }

  return out
}
