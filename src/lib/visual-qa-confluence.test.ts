import {
  renderConfluenceStorage,
  renderMarkdown,
} from './visual-qa-confluence'
import type { VisualQaReport } from './types'

const baseReport = (overrides: Partial<VisualQaReport> = {}): VisualQaReport => ({
  id: 'rep_1',
  userId: 'user_1',
  projectId: null,
  title: 'Onboarding step 2',
  designSource: 'upload',
  designImageUrl: 'https://supa.example.co/storage/v1/object/sign/visual-qa/design.png',
  designFigmaUrl: null,
  implImageUrl: 'https://supa.example.co/storage/v1/object/sign/visual-qa/impl.png',
  status: 'complete',
  summary: 'Looks close, with a few high-severity issues around the primary CTA.',
  severityCounts: { high: 1, medium: 1, low: 1 },
  memoryIds: [],
  confluencePageId: null,
  confluencePageUrl: null,
  error: null,
  createdAt: '2026-04-26T12:00:00.000Z',
  updatedAt: '2026-04-26T12:00:00.000Z',
  issues: [
    {
      id: 'f1',
      severity: 'high',
      category: 'Component',
      exosphereComponent: 'ExButton',
      location: 'Primary CTA, bottom of card',
      description: 'CTA uses a tertiary flavor where the design specifies primary.',
      expected: 'Solid Boomi-blue background, white text, primary flavor.',
      actual: 'Outlined button with grey border, no fill.',
      suggestedFix: 'Change ExButton type to "primary".',
    },
    {
      id: 'f2',
      severity: 'medium',
      category: 'Typography',
      location: 'Section header',
      description: 'Header uses Inter where the design uses Poppins.',
      expected: 'Poppins 24px semibold.',
      actual: 'Inter 24px semibold.',
      suggestedFix: 'Use the design system heading token.',
    },
    {
      id: 'f3',
      severity: 'low',
      category: 'Layout',
      location: 'Form column',
      description: 'Right margin is 4px short of the design.',
      expected: '24px right margin.',
      actual: '20px right margin.',
      suggestedFix: 'Use --exo-spacing-l token.',
    },
  ],
  ...overrides,
})

describe('renderConfluenceStorage', () => {
  it('renders the title in an h1', () => {
    const html = renderConfluenceStorage({
      report: baseReport(),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).toContain('<h1>')
    expect(html).toContain('Onboarding step 2')
  })

  it('renders a header table with severity counts', () => {
    const html = renderConfluenceStorage({
      report: baseReport(),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).toMatch(/<table/i)
    expect(html).toContain('High')
    expect(html).toContain('Medium')
    expect(html).toContain('Low')
  })

  it('embeds both attachments via ri:attachment', () => {
    const html = renderConfluenceStorage({
      report: baseReport(),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).toContain('<ri:attachment ri:filename="design.png"')
    expect(html).toContain('<ri:attachment ri:filename="impl.png"')
  })

  it('includes the summary text', () => {
    const html = renderConfluenceStorage({
      report: baseReport(),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).toContain(
      'Looks close, with a few high-severity issues around the primary CTA.'
    )
  })

  it('groups issues by category with an h2 per category', () => {
    const html = renderConfluenceStorage({
      report: baseReport(),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).toContain('<h2>Component</h2>')
    expect(html).toContain('<h2>Typography</h2>')
    expect(html).toContain('<h2>Layout</h2>')
  })

  it('uses a warning panel for high, note for medium, info for low', () => {
    const html = renderConfluenceStorage({
      report: baseReport(),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).toMatch(/ac:structured-macro ac:name="warning"/)
    expect(html).toMatch(/ac:structured-macro ac:name="note"/)
    expect(html).toMatch(/ac:structured-macro ac:name="info"/)
  })

  it('renders each issue\'s location, description, expected, actual, suggestedFix', () => {
    const html = renderConfluenceStorage({
      report: baseReport(),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).toContain('Primary CTA, bottom of card')
    expect(html).toContain(
      'CTA uses a tertiary flavor where the design specifies primary.'
    )
    expect(html).toContain('Solid Boomi-blue background, white text, primary flavor.')
    expect(html).toContain('Outlined button with grey border, no fill.')
    expect(html).toContain('Change ExButton type to "primary".')
  })

  it('shows the Figma URL when designSource is "figma"', () => {
    const html = renderConfluenceStorage({
      report: baseReport({
        designSource: 'figma',
        designFigmaUrl: 'https://figma.com/design/ABC/Project?node-id=1-2',
      }),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).toContain('https://figma.com/design/ABC/Project?node-id=1-2')
  })

  it('omits the Figma URL when designSource is "upload"', () => {
    const html = renderConfluenceStorage({
      report: baseReport(),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).not.toContain('figma.com')
  })

  it('shows the Exosphere component name when present', () => {
    const html = renderConfluenceStorage({
      report: baseReport(),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).toContain('ExButton')
  })

  it('escapes HTML-special characters in user-supplied text', () => {
    const html = renderConfluenceStorage({
      report: baseReport({
        title: 'A & B <script>',
        issues: [
          {
            id: 'fx',
            severity: 'high',
            category: 'Content',
            location: 'Tooltip',
            description: 'Says "<bad>" instead of expected text',
            expected: '"foo & bar"',
            actual: '<script>alert(1)</script>',
            suggestedFix: 'Replace with safe copy.',
          },
        ],
      }),
      designAttachmentName: 'design.png',
      implAttachmentName: 'impl.png',
    })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('A &amp; B')
  })
})

describe('renderMarkdown', () => {
  it('renders the title in an H1', () => {
    const md = renderMarkdown(baseReport())
    expect(md).toMatch(/^# Visual QA — Onboarding step 2/m)
  })

  it('embeds both image references as markdown', () => {
    const md = renderMarkdown(baseReport())
    expect(md).toContain('![Design](https://supa.example.co/storage/v1/object/sign/visual-qa/design.png)')
    expect(md).toContain('![Implementation](https://supa.example.co/storage/v1/object/sign/visual-qa/impl.png)')
  })

  it('includes the summary in a Summary section', () => {
    const md = renderMarkdown(baseReport())
    expect(md).toMatch(/## Summary\n+Looks close, with a few high-severity issues/)
  })

  it('groups issues by category with H3 headings', () => {
    const md = renderMarkdown(baseReport())
    expect(md).toMatch(/### Component/)
    expect(md).toMatch(/### Typography/)
    expect(md).toMatch(/### Layout/)
  })

  it('renders severity inline with each issue', () => {
    const md = renderMarkdown(baseReport())
    expect(md).toMatch(/\[High\]/)
    expect(md).toMatch(/\[Medium\]/)
    expect(md).toMatch(/\[Low\]/)
  })

  it('renders all per-issue fields', () => {
    const md = renderMarkdown(baseReport())
    expect(md).toContain('Primary CTA, bottom of card')
    expect(md).toContain('Solid Boomi-blue background, white text, primary flavor.')
    expect(md).toContain('Change ExButton type to "primary".')
  })

  it('shows the Figma URL when present', () => {
    const md = renderMarkdown(
      baseReport({
        designSource: 'figma',
        designFigmaUrl: 'https://figma.com/design/ABC/Project?node-id=1-2',
      })
    )
    expect(md).toContain('https://figma.com/design/ABC/Project?node-id=1-2')
  })
})
