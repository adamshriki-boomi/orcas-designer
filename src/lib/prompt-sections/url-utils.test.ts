import { isFigmaUrl, parseGoogleDocUrl, buildGoogleDocsInstructions } from './url-utils'

describe('isFigmaUrl', () => {
  it('returns true for figma.com/design URLs', () => {
    expect(isFigmaUrl('https://www.figma.com/design/abc123/My-Design')).toBe(true)
  })

  it('returns true for figma.com/proto URLs', () => {
    expect(isFigmaUrl('https://www.figma.com/proto/abc123/My-Prototype')).toBe(true)
  })

  it('returns true for figma.com/file URLs', () => {
    expect(isFigmaUrl('https://www.figma.com/file/abc123/My-File')).toBe(true)
  })

  it('returns true for figma.com without www', () => {
    expect(isFigmaUrl('https://figma.com/design/abc123/My-Design')).toBe(true)
  })

  it('returns false for non-Figma URLs', () => {
    expect(isFigmaUrl('https://app.example.com')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isFigmaUrl('')).toBe(false)
  })

  it('returns false for malformed URLs', () => {
    expect(isFigmaUrl('not-a-url')).toBe(false)
  })
})

describe('parseGoogleDocUrl', () => {
  it('detects Google Docs documents', () => {
    const result = parseGoogleDocUrl('https://docs.google.com/document/d/abc123/edit')
    expect(result).toEqual({
      type: 'document',
      docId: 'abc123',
      exportUrl: 'https://docs.google.com/document/d/abc123/export?format=txt',
    })
  })

  it('detects Google Slides presentations', () => {
    const result = parseGoogleDocUrl('https://docs.google.com/presentation/d/xyz789/edit')
    expect(result).toEqual({
      type: 'presentation',
      docId: 'xyz789',
      exportUrl: 'https://docs.google.com/presentation/d/xyz789/export/pdf',
    })
  })

  it('detects Google Sheets spreadsheets', () => {
    const result = parseGoogleDocUrl('https://docs.google.com/spreadsheets/d/sheet1/edit')
    expect(result).toEqual({
      type: 'spreadsheet',
      docId: 'sheet1',
      exportUrl: 'https://docs.google.com/spreadsheets/d/sheet1/export?format=csv',
    })
  })

  it('returns null for non-Google URLs', () => {
    expect(parseGoogleDocUrl('https://app.example.com')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseGoogleDocUrl('')).toBeNull()
  })

  it('returns null for Google URLs without doc ID', () => {
    expect(parseGoogleDocUrl('https://docs.google.com/')).toBeNull()
  })
})

describe('buildGoogleDocsInstructions', () => {
  it('uses default label "UX Research URL"', () => {
    const docInfo = { type: 'document' as const, docId: 'abc', exportUrl: 'https://docs.google.com/document/d/abc/export?format=txt' }
    const result = buildGoogleDocsInstructions('https://docs.google.com/document/d/abc/edit', docInfo)
    expect(result).toContain('**UX Research URL**:')
  })

  it('uses custom label when provided', () => {
    const docInfo = { type: 'document' as const, docId: 'abc', exportUrl: 'https://docs.google.com/document/d/abc/export?format=txt' }
    const result = buildGoogleDocsInstructions('https://docs.google.com/document/d/abc/edit', docInfo, 'Feature Info')
    expect(result).toContain('**Feature Info**:')
    expect(result).not.toContain('UX Research URL')
  })

  it('includes access strategy with export URL', () => {
    const docInfo = { type: 'document' as const, docId: 'abc', exportUrl: 'https://docs.google.com/document/d/abc/export?format=txt' }
    const result = buildGoogleDocsInstructions('https://docs.google.com/document/d/abc/edit', docInfo)
    expect(result).toContain('Access strategy')
    expect(result).toContain('export?format=txt')
  })
})
