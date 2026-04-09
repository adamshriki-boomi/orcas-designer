import { emptyProject, emptyFormField, emptyCurrentImplementation } from '@/lib/types'
import type { Project, SharedSkill, SharedMemory, FileAttachment } from '@/lib/types'

export function createTestProject(overrides: Partial<Project> = {}): Project {
  return {
    ...emptyProject('test-id', 'Test Project'),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createProjectWithFigma(overrides: Partial<Project> = {}): Project {
  return createTestProject({
    figmaFileLink: {
      ...emptyFormField(),
      urlValue: 'https://www.figma.com/design/abc123/My-Design',
    },
    ...overrides,
  })
}

export function createProjectWithDesignSystem(overrides: Partial<Project> = {}): Project {
  return createTestProject({
    designSystemStorybook: {
      ...emptyFormField(),
      urlValue: 'https://storybook.example.com',
    },
    designSystemNpm: {
      ...emptyFormField(),
      inputType: 'text',
      textValue: '@example/design-system',
    },
    designSystemFigma: {
      ...emptyFormField(),
      urlValue: 'https://www.figma.com/design/ds123/Design-System',
    },
    ...overrides,
  })
}

export function createProjectWithCurrentImpl(overrides: Partial<Project> = {}): Project {
  return createTestProject({
    currentImplementation: {
      ...emptyCurrentImplementation(),
      urlValue: 'https://app.example.com',
      figmaLinks: ['https://www.figma.com/design/impl123/Current'],
    },
    ...overrides,
  })
}

export function createFullProject(overrides: Partial<Project> = {}): Project {
  return createTestProject({
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
    figmaFileLink: { ...emptyFormField(), urlValue: 'https://www.figma.com/design/target/Target' },
    designSystemStorybook: { ...emptyFormField(), urlValue: 'https://storybook.example.com' },
    designSystemNpm: { ...emptyFormField(), inputType: 'text', textValue: '@example/ds' },
    designSystemFigma: { ...emptyFormField(), urlValue: 'https://www.figma.com/design/ds/DS' },
    prototypeSketches: { ...emptyFormField(), urlValue: 'https://prototype.example.com' },
    outputType: 'static-and-interactive',
    interactionLevel: 'full-prototype',
    accessibilityLevel: 'wcag-aa',
    browserCompatibility: ['chrome', 'firefox', 'safari'],
    designDirection: {
      primaryColor: '#3B82F6',
      fontFamily: 'Inter',
      motionStyle: 'subtle',
      borderRadiusStyle: 'rounded',
    },
    ...overrides,
  })
}

export function createProjectWithPrototypeFigma(overrides: Partial<Project> = {}): Project {
  return createTestProject({
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
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createStorybookMemory(): SharedMemory {
  return createTestSharedMemory({
    id: 'built-in-exosphere-storybook',
    name: 'Exosphere Storybook',
    description: 'Built-in design system reference for @boomi/exosphere',
    content: '# @boomi/exosphere — Design System Reference\n\n## Component Inventory\n- ExButton\n- ExInput\n- ExCard',
    fileName: 'exosphere-storybook.md',
    isBuiltIn: true,
  })
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

export function createProjectWithStorybookMemory(overrides: Partial<Project> = {}): Project {
  return createTestProject({
    selectedSharedMemoryIds: ['built-in-exosphere-storybook'],
    ...overrides,
  })
}
