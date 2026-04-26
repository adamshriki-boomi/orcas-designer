import {
  VISUAL_QA_CATEGORIES,
  type VisualQaCategory,
  type VisualQaFinding,
  type VisualQaSeverity,
  type VisualQaSeverityCounts,
} from './types'

const generateFindingId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

const SEVERITIES: ReadonlySet<VisualQaSeverity> = new Set(['low', 'medium', 'high'])
const CATEGORIES: ReadonlySet<string> = new Set(VISUAL_QA_CATEGORIES)

export function computeSeverityCounts(
  findings: readonly VisualQaFinding[]
): VisualQaSeverityCounts {
  const counts: VisualQaSeverityCounts = { high: 0, medium: 0, low: 0 }
  for (const f of findings) {
    if (f.severity === 'high' || f.severity === 'medium' || f.severity === 'low') {
      counts[f.severity] += 1
    }
  }
  return counts
}

export function assignFindingIds(findings: readonly VisualQaFinding[]): VisualQaFinding[] {
  return findings.map((f) => (f.id ? f : { ...f, id: generateFindingId() }))
}

export interface VisualQaAiResponse {
  summary: string
  findings: VisualQaFinding[]
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

  const findings = obj.findings
  if (!Array.isArray(findings)) {
    throw new Error('AI response is missing a "findings" array')
  }

  const normalized: VisualQaFinding[] = findings.map((entry, idx) =>
    normalizeFinding(entry, idx)
  )

  return { summary, findings: normalized }
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

function normalizeFinding(entry: unknown, idx: number): VisualQaFinding {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error(`Finding #${idx} is not an object`)
  }
  const f = entry as Record<string, unknown>

  const rawSeverity = typeof f.severity === 'string' ? f.severity.toLowerCase() : ''
  if (!SEVERITIES.has(rawSeverity as VisualQaSeverity)) {
    throw new Error(`Finding #${idx} has unknown severity: ${String(f.severity)}`)
  }
  const severity = rawSeverity as VisualQaSeverity

  const category = typeof f.category === 'string' ? f.category : ''
  if (!CATEGORIES.has(category)) {
    throw new Error(`Finding #${idx} has unknown category: ${String(f.category)}`)
  }

  const requireString = (key: string): string => {
    const v = f[key]
    if (typeof v !== 'string') {
      throw new Error(`Finding #${idx} is missing required string "${key}"`)
    }
    return v
  }

  const out: VisualQaFinding = {
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
