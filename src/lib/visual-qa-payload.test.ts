import {
  buildSystemPrompt,
  buildUserMessage,
  type VisualQaImageMime,
} from './visual-qa-payload'

describe('buildSystemPrompt', () => {
  it('includes the three always-on memories in fixed order', () => {
    const out = buildSystemPrompt({
      exosphereVisualQaMemory: 'EXO_QA_BODY',
      boomiContext: 'BOOMI_BODY',
      productContext: 'PRODUCT_BODY',
      extraMemories: [],
    })
    const exoIdx = out.indexOf('EXO_QA_BODY')
    const boomiIdx = out.indexOf('BOOMI_BODY')
    const productIdx = out.indexOf('PRODUCT_BODY')
    expect(exoIdx).toBeGreaterThan(-1)
    expect(boomiIdx).toBeGreaterThan(exoIdx)
    expect(productIdx).toBeGreaterThan(boomiIdx)
  })

  it('appends each extra memory as its own section with the name', () => {
    const out = buildSystemPrompt({
      exosphereVisualQaMemory: 'a',
      boomiContext: 'b',
      productContext: 'c',
      extraMemories: [
        { name: 'Rivery Context', content: 'RIVERY_BODY' },
        { name: 'Brand Voice', content: 'VOICE_BODY' },
      ],
    })
    expect(out).toContain('Rivery Context')
    expect(out).toContain('RIVERY_BODY')
    expect(out).toContain('Brand Voice')
    expect(out).toContain('VOICE_BODY')
  })

  it('skips empty always-on memories without crashing', () => {
    const out = buildSystemPrompt({
      exosphereVisualQaMemory: '',
      boomiContext: '',
      productContext: 'P',
      extraMemories: [],
    })
    expect(out).toContain('P')
  })

  it('always ends with the JSON schema instructions block', () => {
    const out = buildSystemPrompt({
      exosphereVisualQaMemory: 'a',
      boomiContext: 'b',
      productContext: 'c',
      extraMemories: [],
    })
    expect(out).toMatch(/Return strict JSON/i)
    expect(out).toContain('"summary"')
    expect(out).toContain('"findings"')
    expect(out).toContain('"severity"')
    expect(out).toContain('"category"')
    expect(out).toContain('"location"')
    expect(out).toContain('"description"')
    expect(out).toContain('"expected"')
    expect(out).toContain('"actual"')
    expect(out).toContain('"suggestedFix"')
  })

  it('lists the allowed severity and category values in the schema block', () => {
    const out = buildSystemPrompt({
      exosphereVisualQaMemory: 'a',
      boomiContext: 'b',
      productContext: 'c',
      extraMemories: [],
    })
    expect(out).toContain('low')
    expect(out).toContain('medium')
    expect(out).toContain('high')
    for (const cat of [
      'Layout',
      'Typography',
      'Color',
      'Iconography',
      'Content',
      'Interaction',
      'Accessibility',
      'Component',
    ]) {
      expect(out).toContain(cat)
    }
  })
})

describe('buildUserMessage', () => {
  const args = {
    designB64: 'AAAA',
    designMime: 'image/png' as VisualQaImageMime,
    implB64: 'BBBB',
    implMime: 'image/jpeg' as VisualQaImageMime,
  }

  it('returns a 5-block array: text, image, text, image, text', () => {
    const out = buildUserMessage(args)
    expect(out).toHaveLength(5)
    expect(out[0].type).toBe('text')
    expect(out[1].type).toBe('image')
    expect(out[2].type).toBe('text')
    expect(out[3].type).toBe('image')
    expect(out[4].type).toBe('text')
  })

  it('embeds the base64 image data with the correct media type and source kind', () => {
    const out = buildUserMessage(args)
    const designBlock = out[1]
    if (designBlock.type !== 'image') throw new Error('expected image block')
    expect(designBlock.source.type).toBe('base64')
    expect(designBlock.source.media_type).toBe('image/png')
    expect(designBlock.source.data).toBe('AAAA')

    const implBlock = out[3]
    if (implBlock.type !== 'image') throw new Error('expected image block')
    expect(implBlock.source.media_type).toBe('image/jpeg')
    expect(implBlock.source.data).toBe('BBBB')
  })

  it('labels the design block and the implementation block', () => {
    const out = buildUserMessage(args)
    const designLabel = out[0]
    const implLabel = out[2]
    if (designLabel.type !== 'text') throw new Error('expected text')
    if (implLabel.type !== 'text') throw new Error('expected text')
    expect(designLabel.text.toLowerCase()).toContain('design')
    expect(implLabel.text.toLowerCase()).toContain('implementation')
  })

  it('throws on an unsupported media type', () => {
    expect(() =>
      buildUserMessage({
        ...args,
        designMime: 'image/svg+xml' as unknown as VisualQaImageMime,
      })
    ).toThrow()
  })
})
