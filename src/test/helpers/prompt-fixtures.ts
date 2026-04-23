import { emptyPrompt, emptyFormField, emptyCurrentImplementation } from '@/lib/types'
import type { Prompt, SharedSkill, SharedMemory, FileAttachment } from '@/lib/types'

export function createTestPrompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    ...emptyPrompt('test-id', 'Test Project'),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createPromptWithCurrentImpl(overrides: Partial<Prompt> = {}): Prompt {
  return createTestPrompt({
    currentImplementation: {
      ...emptyCurrentImplementation(),
      urlValue: 'https://app.example.com',
      figmaLinks: ['https://www.figma.com/design/impl123/Current'],
    },
    ...overrides,
  })
}

export function createFullPrompt(overrides: Partial<Prompt> = {}): Prompt {
  return createTestPrompt({
    companyInfo: { ...emptyFormField(), urlValue: 'https://company.example.com' },
    productInfo: { ...emptyFormField(), urlValue: 'https://product.example.com' },
    featureInfo: { ...emptyFormField(), inputType: 'text', textValue: 'Build a dashboard' },
    currentImplementation: {
      ...emptyCurrentImplementation(),
      urlValue: 'https://app.example.com',
      figmaLinks: ['https://www.figma.com/design/impl/Current'],
    },
    uxResearch: { ...emptyFormField(), urlValue: 'https://docs.google.com/document/d/abc123/edit' },
    uxWriting: { ...emptyFormField(), inputType: 'text', textValue: 'Use active voice for all CTAs' },
    prototypeSketches: { ...emptyFormField(), urlValue: 'https://prototype.example.com' },
    designProducts: {
      products: ['wireframe', 'mockup'],
      figmaDestinationUrl: 'https://www.figma.com/design/dest/Destination',
    },
    ...overrides,
  })
}

export function createPromptWithPrototypeFigma(overrides: Partial<Prompt> = {}): Prompt {
  return createTestPrompt({
    prototypeSketches: {
      ...emptyFormField(),
      urlValue: 'https://www.figma.com/proto/proto123/My-Prototype',
    },
    ...overrides,
  })
}

export function createTestFileAttachment(overrides: Partial<FileAttachment> = {}): FileAttachment {
  return {
    id: 'file-1',
    name: 'screenshot.png',
    mimeType: 'image/png',
    size: 1024,
    base64Data: 'iVBORw0KGgoAAAANSUhEUg==',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createTestSharedSkill(overrides: Partial<SharedSkill> = {}): SharedSkill {
  return {
    id: 'skill-1',
    name: 'Test Skill',
    description: 'A test skill',
    type: 'url',
    urlValue: 'https://skill.example.com',
    fileContent: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createTestSharedMemory(overrides: Partial<SharedMemory> = {}): SharedMemory {
  return {
    id: 'memory-1',
    name: 'Test Memory',
    description: 'A test memory',
    content: 'Some context content',
    fileName: 'test-memory.md',
    isBuiltIn: false,
    category: null,
    tags: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createUxWritingMemory(): SharedMemory {
  return createTestSharedMemory({
    id: 'built-in-ux-writing',
    name: 'UX Writing Guidelines',
    description: 'Built-in UX writing guidelines',
    content: '# UX Writing\\n\\n## Voice and Tone\\n- Be empowering\\n- Be relatable',
    fileName: 'ux-writing-guidelines.md',
    isBuiltIn: true,
  });
}

export function createAiVoiceMemory(): SharedMemory {
  return createTestSharedMemory({
    id: 'built-in-ai-voice',
    name: 'Boomi AI Voice',
    description: 'AI-specific voice and tone guidelines',
    content: '# AI Voice\\n\\n## Tone\\n- Empowering\\n- Relatable\\n- Straightforward',
    fileName: 'boomi-ai-voice.md',
    isBuiltIn: true,
  });
}
