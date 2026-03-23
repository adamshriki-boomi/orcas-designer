import { emptyFormField, emptyCurrentImplementation, emptyProject } from './types'

describe('emptyFormField', () => {
  it('returns an object with inputType url', () => {
    expect(emptyFormField().inputType).toBe('url')
  })

  it('returns empty string values', () => {
    const field = emptyFormField()
    expect(field.urlValue).toBe('')
    expect(field.textValue).toBe('')
    expect(field.additionalContext).toBe('')
  })

  it('returns an empty files array', () => {
    expect(emptyFormField().files).toEqual([])
  })

  it('returns a new object on each call', () => {
    const a = emptyFormField()
    const b = emptyFormField()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('emptyCurrentImplementation', () => {
  it('inherits FormFieldData defaults', () => {
    const impl = emptyCurrentImplementation()
    expect(impl.inputType).toBe('url')
    expect(impl.urlValue).toBe('')
    expect(impl.textValue).toBe('')
    expect(impl.files).toEqual([])
  })

  it('has empty figmaLinks array', () => {
    expect(emptyCurrentImplementation().figmaLinks).toEqual([])
  })

  it('defaults implementationMode to add-on-top', () => {
    expect(emptyCurrentImplementation().implementationMode).toBe('add-on-top')
  })
})

describe('emptyProject', () => {
  it('sets id and name from arguments', () => {
    const project = emptyProject('p-1', 'My Project')
    expect(project.id).toBe('p-1')
    expect(project.name).toBe('My Project')
  })

  it('defaults outputType to static-only', () => {
    expect(emptyProject('p-1', 'Test').outputType).toBe('static-only')
  })

  it('defaults interactionLevel to static', () => {
    expect(emptyProject('p-1', 'Test').interactionLevel).toBe('static')
  })

  it('includes built-in-company-context in selectedSharedMemoryIds', () => {
    expect(emptyProject('p-1', 'Test').selectedSharedMemoryIds).toContain('built-in-company-context')
  })

  it('sets designSystemNpm inputType to text', () => {
    expect(emptyProject('p-1', 'Test').designSystemNpm.inputType).toBe('text')
  })

  it('sets createdAt and updatedAt as ISO strings', () => {
    const project = emptyProject('p-1', 'Test')
    expect(() => new Date(project.createdAt)).not.toThrow()
    expect(() => new Date(project.updatedAt)).not.toThrow()
    expect(new Date(project.createdAt).toISOString()).toBe(project.createdAt)
  })

  it('defaults designDirection to null', () => {
    expect(emptyProject('p-1', 'Test').designDirection).toBeNull()
  })

  it('defaults regenerationCount to 0 and generatedPrompt to empty', () => {
    const project = emptyProject('p-1', 'Test')
    expect(project.regenerationCount).toBe(0)
    expect(project.generatedPrompt).toBe('')
  })
})
