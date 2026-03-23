import { buildContextSection } from './context-section'
import { createTestProject, createTestFileAttachment } from '@/test/helpers/project-fixtures'
import { emptyFormField } from '@/lib/types'

describe('buildContextSection', () => {
  it('returns only the CONTEXT header for an empty project', () => {
    const project = createTestProject()
    const result = buildContextSection(project)
    expect(result).toBe('## CONTEXT')
  })

  it('includes the company URL when companyInfo has a URL', () => {
    const project = createTestProject({
      companyInfo: {
        ...emptyFormField(),
        urlValue: 'https://company.example.com',
      },
    })
    const result = buildContextSection(project)
    expect(result).toContain('**Company Info**: https://company.example.com')
  })

  it('includes text content for featureInfo with text input type', () => {
    const project = createTestProject({
      featureInfo: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: 'Build a new dashboard widget',
      },
    })
    const result = buildContextSection(project)
    expect(result).toContain('**Feature Info**:')
    expect(result).toContain('Build a new dashboard widget')
  })

  it('includes file names in ./assets/ format for file attachments', () => {
    const file1 = createTestFileAttachment({ name: 'spec.pdf', mimeType: 'application/pdf' })
    const file2 = createTestFileAttachment({ id: 'file-2', name: 'mockup.png', mimeType: 'image/png' })
    const project = createTestProject({
      productInfo: {
        ...emptyFormField(),
        inputType: 'file',
        files: [file1, file2],
      },
    })
    const result = buildContextSection(project)
    expect(result).toContain('`./assets/spec.pdf`')
    expect(result).toContain('`./assets/mockup.png`')
  })

  it('includes additional context when provided on a field', () => {
    const project = createTestProject({
      companyInfo: {
        ...emptyFormField(),
        urlValue: 'https://company.example.com',
        additionalContext: 'We are a B2B SaaS company',
      },
    })
    const result = buildContextSection(project)
    expect(result).toContain('> Additional context: We are a B2B SaaS company')
  })

  it('includes Google Docs access strategy when feature info is a Google Docs URL', () => {
    const project = createTestProject({
      featureInfo: {
        ...emptyFormField(),
        urlValue: 'https://docs.google.com/document/d/abc123/edit',
      },
    })
    const result = buildContextSection(project)
    expect(result).toContain('**Feature Info**:')
    expect(result).toContain('Access strategy')
    expect(result).toContain('export?format=txt')
  })

  it('does not include access strategy for non-Google feature info URL', () => {
    const project = createTestProject({
      featureInfo: {
        ...emptyFormField(),
        urlValue: 'https://notion.so/my-feature-spec',
      },
    })
    const result = buildContextSection(project)
    expect(result).toContain('**Feature Info**: https://notion.so/my-feature-spec')
    expect(result).not.toContain('Access strategy')
  })
})
