import { renderHook, act } from '@testing-library/react'
import { useWizardForm } from './use-wizard-form'
import { createTestPrompt } from '@/test/helpers/prompt-fixtures'
import type { FormFieldData, CustomSkill, CustomMemory, FeatureDefinitionData, DesignProductsData } from '@/lib/types'

describe('useWizardForm', () => {
  it('returns initial state matching emptyPrompt defaults', () => {
    const { result } = renderHook(() => useWizardForm())
    const defaults = result.current.formData

    expect(defaults.name).toBe('New Prompt')
    expect(defaults.id).toBe('')
    expect(defaults.promptMode).toBe('comprehensive')
    expect(defaults.featureDefinition).toEqual({ mode: 'new', name: '', briefDescription: '' })
    expect(defaults.designProducts).toEqual({ products: ['wireframe'], figmaDestinationUrl: '' })
    expect(defaults.selectedSharedSkillIds).toEqual([])
    expect(defaults.customSkills).toEqual([])
    expect(defaults.selectedSharedMemoryIds).toEqual(['built-in-company-context', 'built-in-ux-writing'])
    expect(defaults.customMemories).toEqual([])
    expect(defaults.regenerationCount).toBe(0)
  })

  it('initial state does NOT include removed Deliverables fields', () => {
    const { result } = renderHook(() => useWizardForm())
    const defaults = result.current.formData as unknown as Record<string, unknown>
    expect(defaults.outputDirectory).toBeUndefined()
    expect(defaults.accessibilityLevel).toBeUndefined()
    expect(defaults.browserCompatibility).toBeUndefined()
    expect(defaults.externalResourcesAccessible).toBeUndefined()
    expect(defaults.designDirection).toBeUndefined()
    expect(defaults.outputType).toBeUndefined()
    expect(defaults.interactionLevel).toBeUndefined()
  })

  it('accepts a custom initialProject parameter', () => {
    const custom = createTestPrompt({ name: 'Custom Project' })
    const { result } = renderHook(() => useWizardForm(custom))

    expect(result.current.formData.name).toBe('Custom Project')
    expect(result.current.formData.id).toBe('test-id')
  })

  it('setName updates name', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setName('My New Name')
    })

    expect(result.current.formData.name).toBe('My New Name')
  })

  it('setField updates a form field', () => {
    const { result } = renderHook(() => useWizardForm())
    const fieldData: FormFieldData = {
      inputType: 'text',
      urlValue: '',
      textValue: 'We are a SaaS company',
      files: [],
      additionalContext: 'Extra info',
    }

    act(() => {
      result.current.setField('companyInfo', fieldData)
    })

    expect(result.current.formData.companyInfo).toEqual(fieldData)
  })

  it('setField updates productInfo field', () => {
    const { result } = renderHook(() => useWizardForm())
    const fieldData: FormFieldData = {
      inputType: 'url',
      urlValue: 'https://product.example.com',
      textValue: '',
      files: [],
      additionalContext: '',
    }

    act(() => {
      result.current.setField('productInfo', fieldData)
    })

    expect(result.current.formData.productInfo.urlValue).toBe('https://product.example.com')
  })

  it('setCurrentImpl updates currentImplementation', () => {
    const { result } = renderHook(() => useWizardForm())
    const implData = {
      inputType: 'url' as const,
      urlValue: 'https://app.example.com',
      textValue: '',
      files: [],
      additionalContext: '',
      figmaLinks: ['https://figma.com/design/abc/File'],
      implementationMode: 'redesign' as const,
    }

    act(() => {
      result.current.setCurrentImpl(implData)
    })

    expect(result.current.formData.currentImplementation).toEqual(implData)
    expect(result.current.formData.currentImplementation.implementationMode).toBe('redesign')
    expect(result.current.formData.currentImplementation.figmaLinks).toHaveLength(1)
  })

  it('setFeatureDefinition updates featureDefinition', () => {
    const { result } = renderHook(() => useWizardForm())
    const data: FeatureDefinitionData = {
      mode: 'improvement',
      name: 'Checkout redesign',
      briefDescription: 'Rework the 3-step checkout to reduce drop-off.',
    }

    act(() => {
      result.current.setFeatureDefinition(data)
    })

    expect(result.current.formData.featureDefinition).toEqual(data)
    expect(result.current.formData.featureDefinition.mode).toBe('improvement')
  })

  it('setDesignProducts updates designProducts', () => {
    const { result } = renderHook(() => useWizardForm())
    const data: DesignProductsData = {
      products: ['wireframe', 'animated-prototype'],
      figmaDestinationUrl: 'https://www.figma.com/design/dest/Destination',
    }

    act(() => {
      result.current.setDesignProducts(data)
    })

    expect(result.current.formData.designProducts).toEqual(data)
    expect(result.current.formData.designProducts.products).toHaveLength(2)
  })

  it('setSharedSkills updates selectedSharedSkillIds', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setSharedSkills(['skill-1', 'skill-2'])
    })

    expect(result.current.formData.selectedSharedSkillIds).toEqual(['skill-1', 'skill-2'])
  })

  it('setCustomSkills updates customSkills', () => {
    const { result } = renderHook(() => useWizardForm())
    const skills: CustomSkill[] = [
      { id: 'cs-1', name: 'My Skill', type: 'url', urlValue: 'https://example.com', fileContent: null },
    ]

    act(() => {
      result.current.setCustomSkills(skills)
    })

    expect(result.current.formData.customSkills).toEqual(skills)
    expect(result.current.formData.customSkills).toHaveLength(1)
  })

  it('setSharedMemories updates selectedSharedMemoryIds', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setSharedMemories(['mem-1', 'mem-2', 'mem-3'])
    })

    expect(result.current.formData.selectedSharedMemoryIds).toEqual(['mem-1', 'mem-2', 'mem-3'])
  })

  it('setCustomMemories updates customMemories', () => {
    const { result } = renderHook(() => useWizardForm())
    const memories: CustomMemory[] = [
      { id: 'cm-1', name: 'Custom Context', content: 'Important context here' },
    ]

    act(() => {
      result.current.setCustomMemories(memories)
    })

    expect(result.current.formData.customMemories).toEqual(memories)
  })

  it('loadPrompt replaces entire state', () => {
    const { result } = renderHook(() => useWizardForm())
    const project = createTestPrompt({
      name: 'Loaded Project',
      promptMode: 'lite',
    })

    act(() => {
      result.current.loadPrompt(project)
    })

    expect(result.current.formData.name).toBe('Loaded Project')
    expect(result.current.formData.promptMode).toBe('lite')
    expect(result.current.formData.id).toBe('test-id')
  })

  it('multiple sequential updates accumulate correctly', () => {
    const { result } = renderHook(() => useWizardForm())

    act(() => {
      result.current.setName('Updated Project')
    })
    act(() => {
      result.current.setFeatureDefinition({
        mode: 'improvement',
        name: 'Something',
        briefDescription: 'Brief',
      })
    })
    act(() => {
      result.current.setDesignProducts({
        products: ['mockup'],
        figmaDestinationUrl: '',
      })
    })

    expect(result.current.formData.name).toBe('Updated Project')
    expect(result.current.formData.featureDefinition.mode).toBe('improvement')
    expect(result.current.formData.designProducts.products).toEqual(['mockup'])
    // unchanged fields remain at defaults
    expect(result.current.formData.promptMode).toBe('comprehensive')
  })
})
