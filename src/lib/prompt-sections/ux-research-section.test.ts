import { buildUxResearchSection } from './ux-research-section'
import { createTestPrompt, createTestFileAttachment } from '@/test/helpers/prompt-fixtures'
import { emptyFormField } from '@/lib/types'

describe('buildUxResearchSection', () => {
  it('returns empty string when there is no content', () => {
    const project = createTestPrompt()
    const result = buildUxResearchSection(project)
    expect(result).toBe('')
  })

  it('includes URL and WebFetch instruction for a regular URL', () => {
    const project = createTestPrompt({
      uxResearch: {
        ...emptyFormField(),
        urlValue: 'https://research.example.com/findings',
      },
    })
    const result = buildUxResearchSection(project)
    expect(result).toContain('https://research.example.com/findings')
    expect(result).toContain('Fetch this URL via WebFetch')
  })

  it('detects Google Docs document URL and includes export URL with format=txt', () => {
    const project = createTestPrompt({
      uxResearch: {
        ...emptyFormField(),
        urlValue: 'https://docs.google.com/document/d/abc123/edit',
      },
    })
    const result = buildUxResearchSection(project)
    expect(result).toContain('Google Doc')
    expect(result).toContain('https://docs.google.com/document/d/abc123/export?format=txt')
  })

  it('detects Google Slides URL and includes export/pdf', () => {
    const project = createTestPrompt({
      uxResearch: {
        ...emptyFormField(),
        urlValue: 'https://docs.google.com/presentation/d/slide456/edit',
      },
    })
    const result = buildUxResearchSection(project)
    expect(result).toContain('Google Slides')
    expect(result).toContain('https://docs.google.com/presentation/d/slide456/export/pdf')
  })

  it('detects Google Sheets URL and includes export?format=csv', () => {
    const project = createTestPrompt({
      uxResearch: {
        ...emptyFormField(),
        urlValue: 'https://docs.google.com/spreadsheets/d/sheet789/edit',
      },
    })
    const result = buildUxResearchSection(project)
    expect(result).toContain('Google Sheet')
    expect(result).toContain('https://docs.google.com/spreadsheets/d/sheet789/export?format=csv')
  })

  it('includes research findings for text content', () => {
    const project = createTestPrompt({
      uxResearch: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: 'Users prefer a dark theme for dashboards',
      },
    })
    const result = buildUxResearchSection(project)
    expect(result).toContain('**Research findings**:')
    expect(result).toContain('Users prefer a dark theme for dashboards')
  })

  it('includes file names for file attachments', () => {
    const file = createTestFileAttachment({ name: 'research-report.pdf' })
    const project = createTestPrompt({
      uxResearch: {
        ...emptyFormField(),
        inputType: 'file',
        files: [file],
      },
    })
    const result = buildUxResearchSection(project)
    expect(result).toContain('`./assets/research-report.pdf`')
  })

  it('includes additional context when provided', () => {
    const project = createTestPrompt({
      uxResearch: {
        ...emptyFormField(),
        urlValue: 'https://research.example.com',
        additionalContext: 'Focus on the mobile findings section',
      },
    })
    const result = buildUxResearchSection(project)
    expect(result).toContain('> Additional context: Focus on the mobile findings section')
  })
})
