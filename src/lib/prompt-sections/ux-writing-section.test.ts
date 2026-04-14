import { buildUxWritingSection } from './ux-writing-section'
import {
  createTestPrompt,
  createTestFileAttachment,
  createTestSharedMemory,
} from '@/test/helpers/prompt-fixtures'
import { emptyFormField } from '@/lib/types'
import {
  BUILT_IN_UX_WRITING_MEMORY_ID,
  BUILT_IN_AI_VOICE_MEMORY_ID,
} from '@/lib/constants'

describe('buildUxWritingSection', () => {
  it('returns empty string when there is no content and no memories selected', () => {
    const project = createTestPrompt()
    const result = buildUxWritingSection(project)
    expect(result).toBe('')
  })

  it('includes URL and WebFetch instruction for a regular URL', () => {
    const project = createTestPrompt({
      uxWriting: {
        ...emptyFormField(),
        urlValue: 'https://writing.example.com/guidelines',
      },
    })
    const result = buildUxWritingSection(project)
    expect(result).toContain('https://writing.example.com/guidelines')
    expect(result).toContain('Fetch this URL via WebFetch')
  })

  it('detects Google Docs document URL and includes export URL with format=txt', () => {
    const project = createTestPrompt({
      uxWriting: {
        ...emptyFormField(),
        urlValue: 'https://docs.google.com/document/d/abc123/edit',
      },
    })
    const result = buildUxWritingSection(project)
    expect(result).toContain('Google Doc')
    expect(result).toContain('https://docs.google.com/document/d/abc123/export?format=txt')
  })

  it('includes UX writing guidelines for text content', () => {
    const project = createTestPrompt({
      uxWriting: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: 'Use active voice for all CTAs',
      },
    })
    const result = buildUxWritingSection(project)
    expect(result).toContain('**Writing guidelines**:')
    expect(result).toContain('Use active voice for all CTAs')
  })

  it('includes file names for file attachments', () => {
    const file = createTestFileAttachment({ name: 'writing-guide.pdf' })
    const project = createTestPrompt({
      uxWriting: {
        ...emptyFormField(),
        inputType: 'file',
        files: [file],
      },
    })
    const result = buildUxWritingSection(project)
    expect(result).toContain('`./assets/writing-guide.pdf`')
  })

  it('includes additional context when provided', () => {
    const project = createTestPrompt({
      uxWriting: {
        ...emptyFormField(),
        urlValue: 'https://writing.example.com',
        additionalContext: 'Focus on error message guidelines',
      },
    })
    const result = buildUxWritingSection(project)
    expect(result).toContain('> Additional context: Focus on error message guidelines')
  })

  it('includes selected UX writing memory content inline', () => {
    const uxWritingMemory = createTestSharedMemory({
      id: BUILT_IN_UX_WRITING_MEMORY_ID,
      name: 'UX Writing Guidelines',
      content: '# UX Writing\n\n## Voice and Tone\n- Be empowering\n- Be relatable',
      isBuiltIn: true,
    })
    const aiVoiceMemory = createTestSharedMemory({
      id: BUILT_IN_AI_VOICE_MEMORY_ID,
      name: 'Boomi AI Voice',
      content: '# AI Voice\n\n## Tone\n- Empowering\n- Relatable\n- Straightforward',
      isBuiltIn: true,
    })
    const sharedMemories = [uxWritingMemory, aiVoiceMemory]
    const project = createTestPrompt({
      selectedSharedMemoryIds: [
        'built-in-company-context',
        BUILT_IN_UX_WRITING_MEMORY_ID,
        BUILT_IN_AI_VOICE_MEMORY_ID,
      ],
    })
    const result = buildUxWritingSection(project, sharedMemories)
    expect(result).toContain('### UX Writing Guidelines')
    expect(result).toContain('# UX Writing')
    expect(result).toContain('- Be empowering')
    expect(result).toContain('### Boomi AI Voice')
    expect(result).toContain('# AI Voice')
    expect(result).toContain('- Straightforward')
  })

  it('excludes UX writing memories that are not selected', () => {
    const uxWritingMemory = createTestSharedMemory({
      id: BUILT_IN_UX_WRITING_MEMORY_ID,
      name: 'UX Writing Guidelines',
      content: '# UX Writing\n\n## Voice and Tone\n- Be empowering',
      isBuiltIn: true,
    })
    const sharedMemories = [uxWritingMemory]
    const project = createTestPrompt({
      selectedSharedMemoryIds: ['built-in-company-context'],
    })
    const result = buildUxWritingSection(project, sharedMemories)
    expect(result).toBe('')
  })

  it('includes both memories and custom content together', () => {
    const uxWritingMemory = createTestSharedMemory({
      id: BUILT_IN_UX_WRITING_MEMORY_ID,
      name: 'UX Writing Guidelines',
      content: '# UX Writing\n\n## Voice and Tone\n- Be empowering',
      isBuiltIn: true,
    })
    const sharedMemories = [uxWritingMemory]
    const project = createTestPrompt({
      selectedSharedMemoryIds: ['built-in-company-context', BUILT_IN_UX_WRITING_MEMORY_ID],
      uxWriting: {
        ...emptyFormField(),
        inputType: 'text',
        textValue: 'Use active voice for all CTAs',
      },
    })
    const result = buildUxWritingSection(project, sharedMemories)
    expect(result).toContain('### UX Writing Guidelines')
    expect(result).toContain('# UX Writing')
    expect(result).toContain('**Writing guidelines**:')
    expect(result).toContain('Use active voice for all CTAs')
  })
})
