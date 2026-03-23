import { buildMemorySection } from './memory-section'
import { createTestProject, createTestSharedMemory, createStorybookMemory, createProjectWithStorybookMemory } from '@/test/helpers/project-fixtures'

describe('buildMemorySection', () => {
  it('returns empty string when no memories are selected', () => {
    const project = createTestProject({
      selectedSharedMemoryIds: [],
      customMemories: [],
    })
    const result = buildMemorySection(project, [])
    expect(result).toBe('')
  })

  it('includes shared memory names and content when selected', () => {
    const memory1 = createTestSharedMemory({
      id: 'mem-1',
      name: 'Company Standards',
      fileName: 'company-standards.md',
      content: 'Always use blue as the primary color.',
    })
    const memory2 = createTestSharedMemory({
      id: 'mem-2',
      name: 'Brand Guidelines',
      fileName: 'brand-guidelines.md',
      content: 'Use Inter font for all headings.',
    })
    const project = createTestProject({
      selectedSharedMemoryIds: ['mem-1', 'mem-2'],
      customMemories: [],
    })
    const result = buildMemorySection(project, [memory1, memory2])
    expect(result).toContain('### Company Standards (company-standards.md)')
    expect(result).toContain('Always use blue as the primary color.')
    expect(result).toContain('### Brand Guidelines (brand-guidelines.md)')
    expect(result).toContain('Use Inter font for all headings.')
  })

  it('includes custom memory names and content', () => {
    const project = createTestProject({
      selectedSharedMemoryIds: [],
      customMemories: [
        { id: 'cust-1', name: 'Project Notes', content: 'Focus on mobile-first design' },
      ],
    })
    const result = buildMemorySection(project, [])
    expect(result).toContain('### Project Notes (custom)')
    expect(result).toContain('Focus on mobile-first design')
  })

  it('includes built-in storybook memory when selected', () => {
    const storybookMem = createStorybookMemory()
    const project = createProjectWithStorybookMemory()
    const result = buildMemorySection(project, [storybookMem])
    expect(result).toContain('### Exosphere Storybook (exosphere-storybook.md)')
    expect(result).toContain('Component Inventory')
  })

  it('marks design system memories as AUTHORITATIVE', () => {
    const storybookMem = createStorybookMemory()
    const project = createProjectWithStorybookMemory()
    const result = buildMemorySection(project, [storybookMem])
    expect(result).toContain('EXCEPTION')
    expect(result).toContain('Design system memories are AUTHORITATIVE')
    expect(result).toContain('MANDATORY component palette')
  })

  it('omits non-design-system context line when storybook memory is the only memory', () => {
    const storybookMem = createStorybookMemory()
    const project = createProjectWithStorybookMemory()
    const result = buildMemorySection(project, [storybookMem])
    expect(result).not.toContain('non-design-system memories provide supporting context only')
  })

  it('includes non-design-system context line when both DS and non-DS memories are present', () => {
    const storybookMem = createStorybookMemory()
    const otherMem = createTestSharedMemory({
      id: 'mem-other',
      name: 'Other Context',
      fileName: 'other.md',
      content: 'Some extra context',
    })
    const project = createProjectWithStorybookMemory({
      selectedSharedMemoryIds: ['built-in-exosphere-storybook', 'mem-other'],
    })
    const result = buildMemorySection(project, [storybookMem, otherMem])
    expect(result).toContain('non-design-system memories provide supporting context only')
  })

  it('uses MANDATORY web component language when DS memory is present', () => {
    const storybookMem = createStorybookMemory()
    const project = createProjectWithStorybookMemory()
    const result = buildMemorySection(project, [storybookMem])
    expect(result).toContain('MANDATORY')
    expect(result).toContain('web components')
    expect(result).toContain('NOT framework-specific')
  })

  it('does not contain generic "implement equivalent behavior" line when DS memory is present', () => {
    const storybookMem = createStorybookMemory()
    const project = createProjectWithStorybookMemory()
    const result = buildMemorySection(project, [storybookMem])
    expect(result).not.toContain('implement equivalent behavior using the tech approach')
  })

  it('uses standard supporting context language for non-design-system memories', () => {
    const memory = createTestSharedMemory({
      id: 'mem-1',
      name: 'Company Standards',
      fileName: 'company-standards.md',
      content: 'Use blue for primary color.',
    })
    const project = createTestProject({
      selectedSharedMemoryIds: ['mem-1'],
      customMemories: [],
    })
    const result = buildMemorySection(project, [memory])
    expect(result).toContain('memories provide supporting context only')
    expect(result).not.toContain('AUTHORITATIVE')
  })

  it('keeps original "implement equivalent behavior" line when no DS memory', () => {
    const memory = createTestSharedMemory({
      id: 'mem-1',
      name: 'Tech Stack',
      fileName: 'tech-stack.md',
      content: 'Uses React and Redux.',
    })
    const project = createTestProject({
      selectedSharedMemoryIds: ['mem-1'],
      customMemories: [],
    })
    const result = buildMemorySection(project, [memory])
    expect(result).toContain('implement equivalent behavior using the tech approach')
    expect(result).not.toContain('NOT framework-specific')
  })

  it('includes both shared and custom memories together', () => {
    const sharedMemory = createTestSharedMemory({
      id: 'mem-1',
      name: 'Shared Context',
      fileName: 'shared.md',
      content: 'Shared content here.',
    })
    const project = createTestProject({
      selectedSharedMemoryIds: ['mem-1'],
      customMemories: [
        { id: 'cust-1', name: 'Custom Notes', content: 'Custom content here.' },
      ],
    })
    const result = buildMemorySection(project, [sharedMemory])
    expect(result).toContain('## MEMORIES')
    expect(result).toContain('### Shared Context (shared.md)')
    expect(result).toContain('Shared content here.')
    expect(result).toContain('### Custom Notes (custom)')
    expect(result).toContain('Custom content here.')
  })
})
