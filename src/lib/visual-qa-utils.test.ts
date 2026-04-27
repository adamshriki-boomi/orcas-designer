import {
  computeSeverityCounts,
  assignIssueIds,
  normalizeAiResponse,
} from './visual-qa-utils'
import type { VisualQaIssue } from './types'

const issue = (overrides: Partial<VisualQaIssue> = {}): VisualQaIssue => ({
  id: '',
  severity: 'medium',
  category: 'Layout',
  location: 'Header',
  description: 'desc',
  expected: 'exp',
  actual: 'act',
  suggestedFix: 'fix',
  ...overrides,
})

describe('computeSeverityCounts', () => {
  it('returns all zeros for an empty list', () => {
    expect(computeSeverityCounts([])).toEqual({ high: 0, medium: 0, low: 0 })
  })

  it('counts each severity', () => {
    const issues: VisualQaIssue[] = [
      issue({ severity: 'high' }),
      issue({ severity: 'high' }),
      issue({ severity: 'medium' }),
      issue({ severity: 'low' }),
      issue({ severity: 'low' }),
      issue({ severity: 'low' }),
    ]
    expect(computeSeverityCounts(issues)).toEqual({ high: 2, medium: 1, low: 3 })
  })
})

describe('assignIssueIds', () => {
  it('assigns a non-empty id to every issue without one', () => {
    const input = [
      issue({ id: '' }),
      issue({ id: '' }),
      issue({ id: '' }),
    ]
    const out = assignIssueIds(input)
    expect(out).toHaveLength(3)
    out.forEach((f) => expect(f.id).toMatch(/.+/))
    const ids = new Set(out.map((f) => f.id))
    expect(ids.size).toBe(3)
  })

  it('preserves an existing id', () => {
    const input = [issue({ id: 'keep-me' }), issue({ id: '' })]
    const out = assignIssueIds(input)
    expect(out[0].id).toBe('keep-me')
    expect(out[1].id).not.toBe('')
    expect(out[1].id).not.toBe('keep-me')
  })
})

describe('normalizeAiResponse', () => {
  const validRaw = {
    summary: 'A short summary.',
    issues: [
      {
        severity: 'high',
        category: 'Layout',
        location: 'Header',
        description: 'd',
        expected: 'e',
        actual: 'a',
        suggestedFix: 'f',
      },
    ],
  }

  it('accepts a plain object', () => {
    const out = normalizeAiResponse(validRaw)
    expect(out.summary).toBe('A short summary.')
    expect(out.issues).toHaveLength(1)
    expect(out.issues[0].severity).toBe('high')
  })

  it('accepts a JSON string', () => {
    const out = normalizeAiResponse(JSON.stringify(validRaw))
    expect(out.summary).toBe('A short summary.')
  })

  it('strips ```json fences', () => {
    const fenced = '```json\n' + JSON.stringify(validRaw) + '\n```'
    const out = normalizeAiResponse(fenced)
    expect(out.issues).toHaveLength(1)
  })

  it('strips bare ``` fences', () => {
    const fenced = '```\n' + JSON.stringify(validRaw) + '\n```'
    const out = normalizeAiResponse(fenced)
    expect(out.issues).toHaveLength(1)
  })

  it('extracts JSON object from prose-prefixed text', () => {
    const text = 'Here is the report:\n' + JSON.stringify(validRaw)
    const out = normalizeAiResponse(text)
    expect(out.issues).toHaveLength(1)
  })

  it('lowercases severity', () => {
    const out = normalizeAiResponse({
      ...validRaw,
      issues: [{ ...validRaw.issues[0], severity: 'HIGH' }],
    })
    expect(out.issues[0].severity).toBe('high')
  })

  it('preserves an optional exosphereComponent', () => {
    const out = normalizeAiResponse({
      ...validRaw,
      issues: [
        { ...validRaw.issues[0], exosphereComponent: 'ExButton' },
      ],
    })
    expect(out.issues[0].exosphereComponent).toBe('ExButton')
  })

  it('throws when summary is missing', () => {
    expect(() =>
      normalizeAiResponse({ issues: validRaw.issues })
    ).toThrow()
  })

  it('throws when issues is not an array', () => {
    expect(() =>
      normalizeAiResponse({ summary: 's', issues: 'nope' })
    ).toThrow()
  })

  it('throws on an unknown severity', () => {
    expect(() =>
      normalizeAiResponse({
        ...validRaw,
        issues: [{ ...validRaw.issues[0], severity: 'critical' }],
      })
    ).toThrow()
  })

  it('throws on an unknown category', () => {
    expect(() =>
      normalizeAiResponse({
        ...validRaw,
        issues: [{ ...validRaw.issues[0], category: 'Vibes' }],
      })
    ).toThrow()
  })

  it('throws on a issue missing required text fields', () => {
    expect(() =>
      normalizeAiResponse({
        ...validRaw,
        issues: [{ severity: 'high', category: 'Layout' }],
      })
    ).toThrow()
  })

  it('throws on a non-JSON string', () => {
    expect(() => normalizeAiResponse('not json at all')).toThrow()
  })
})
