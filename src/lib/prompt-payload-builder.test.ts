import { buildPromptGenerationPayload } from './prompt-payload-builder';
import { emptyFormField } from './types';
import type { SharedSkill, SharedMemory } from './types';
import {
  createTestPrompt,
  createPromptWithFigma,
  createPromptWithDesignSystem,
  createFullPrompt,
} from '@/test/helpers/prompt-fixtures';

const sharedSkills: SharedSkill[] = [];
const sharedMemories: SharedMemory[] = [];

describe('buildPromptGenerationPayload', () => {
  describe('wizardSnapshot', () => {
    it('produces all eight section keys even when fields are empty', () => {
      const prompt = createTestPrompt();
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);

      expect(Object.keys(wizardSnapshot).sort()).toEqual(
        [
          'Company & Product',
          'Current State',
          'Deliverables & Constraints',
          'Design System',
          'Feature',
          'Voice & Writing',
        ].sort(),
      );
    });

    it('merges Company Info and Product Info under a single section', () => {
      const prompt = createTestPrompt({
        companyInfo: { ...emptyFormField(), inputType: 'text', textValue: 'Boomi integration platform' },
        productInfo: { ...emptyFormField(), inputType: 'text', textValue: 'Rivery data pipelines' },
      });

      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      const companyProduct = wizardSnapshot['Company & Product'];

      expect(companyProduct).toContain('Boomi integration platform');
      expect(companyProduct).toContain('Rivery data pipelines');
      expect(companyProduct).toContain('## Company');
      expect(companyProduct).toContain('## Product');
    });

    it('surfaces urlValue with a Reference URL label', () => {
      const prompt = createTestPrompt({
        companyInfo: { ...emptyFormField(), urlValue: 'https://boomi.com' },
      });
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      expect(wizardSnapshot['Company & Product']).toContain('Reference URL: https://boomi.com');
    });

    it('merges Current Implementation, UX Research, and Prototypes into Current State', () => {
      const prompt = createFullPrompt();
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      const state = wizardSnapshot['Current State'];

      expect(state).toContain('## Existing app / redesign');
      expect(state).toContain('## UX research findings');
      expect(state).toContain('## Prior prototypes or wireframes');
    });

    it('includes figmaLinks in the Current State section when present', () => {
      const prompt = createFullPrompt();
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      expect(wizardSnapshot['Current State']).toContain('Figma links:');
      expect(wizardSnapshot['Current State']).toMatch(/figma\.com/);
    });

    it('notes implementation mode in Current State', () => {
      const addOnTop = buildPromptGenerationPayload(
        createTestPrompt(),
        sharedSkills,
        sharedMemories,
      );
      expect(addOnTop.wizardSnapshot['Current State']).toContain('Add on top of existing app');
    });

    it('merges all four design-system fields into a single section', () => {
      const prompt = createPromptWithFigma({
        designSystemStorybook: { ...emptyFormField(), urlValue: 'https://storybook.example.com' },
        designSystemNpm: { ...emptyFormField(), inputType: 'text', textValue: '@boomi/exosphere' },
        designSystemFigma: { ...emptyFormField(), urlValue: 'https://figma.com/design/ref' },
      });
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      const ds = wizardSnapshot['Design System'];

      expect(ds).toContain('Target Figma file');
      expect(ds).toContain('Storybook');
      expect(ds).toContain('NPM package');
      expect(ds).toContain('Reference Figma');
      expect(ds).toContain('@boomi/exosphere');
    });

    it('includes a complete Deliverables & Constraints section', () => {
      const prompt = createTestPrompt({
        accessibilityLevel: 'wcag-aa',
        browserCompatibility: ['chrome', 'firefox'],
        outputDirectory: './output/v2/',
        externalResourcesAccessible: false,
      });
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      const deliverables = wizardSnapshot['Deliverables & Constraints'];

      expect(deliverables).toContain('wcag-aa');
      expect(deliverables).toContain('chrome, firefox');
      expect(deliverables).toContain('./output/v2/');
      expect(deliverables).toContain('may NOT be accessible');
    });

    it('does NOT include Output Type or Interaction Level (removed fields)', () => {
      const prompt = createTestPrompt();
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);

      const allText = Object.values(wizardSnapshot).join('\n').toLowerCase();
      expect(allText).not.toContain('output type:');
      expect(allText).not.toContain('interaction level:');
      expect(allText).not.toContain('click-through');
      expect(allText).not.toContain('full-prototype');
    });
  });

  describe('contextSnapshot', () => {
    it('includes mandatory skills filtered for this prompt', () => {
      const prompt = createTestPrompt();
      const { contextSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      // frontend-design has includeCondition='always'
      expect(contextSnapshot.mandatorySkills.map((s) => s.name)).toContain('frontend-design');
    });

    it('includes the exosphere skill (replaces the former storybook memory)', () => {
      const prompt = createTestPrompt();
      const { contextSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      const names = contextSnapshot.mandatorySkills.map((s) => s.name);
      expect(names).toContain('exosphere');
      // And the old embedded storybook memory is gone — no memory with that id should appear
      const memoryIds = contextSnapshot.sharedMemories.map((m) => m.id);
      expect(memoryIds).not.toContain('built-in-exosphere-storybook');
    });

    it('conditional skills only appear when their condition is met', () => {
      const withoutFigma = buildPromptGenerationPayload(
        createTestPrompt(),
        sharedSkills,
        sharedMemories,
      );
      const withFigma = buildPromptGenerationPayload(
        createPromptWithFigma({ currentImplementation: { ...createPromptWithDesignSystem().currentImplementation, figmaLinks: ['https://figma.com/design/impl'] } }),
        sharedSkills,
        sharedMemories,
      );

      expect(withoutFigma.contextSnapshot.mandatorySkills.map((s) => s.name)).not.toContain(
        'implement-design',
      );
      expect(withFigma.contextSnapshot.mandatorySkills.map((s) => s.name)).toContain(
        'implement-design',
      );
    });

    it('resolves selected shared memories by id', () => {
      const memory: SharedMemory = {
        id: 'mem-1',
        name: 'Exosphere inventory',
        description: 'Component catalog',
        content: '## ExButton\n## ExInput',
        fileName: '',
        isBuiltIn: true,
        category: 'design-system',
        tags: [],
        createdAt: '',
        updatedAt: '',
      };
      const prompt = createTestPrompt({ selectedSharedMemoryIds: ['mem-1'] });

      const { contextSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, [memory]);
      expect(contextSnapshot.sharedMemories).toHaveLength(1);
      expect(contextSnapshot.sharedMemories[0].content).toContain('ExButton');
    });

    it('skips memory ids that no longer resolve to a shared memory', () => {
      const prompt = createTestPrompt({ selectedSharedMemoryIds: ['missing-id'] });
      const { contextSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, []);
      expect(contextSnapshot.sharedMemories).toHaveLength(0);
    });

    it('includes custom memories and custom skills verbatim', () => {
      const prompt = createTestPrompt({
        customMemories: [{ id: 'cm-1', name: 'Internal glossary', content: 'ETL = extract...' }],
        customSkills: [{ id: 'cs-1', name: 'deploy-helper', type: 'url', urlValue: 'https://x', fileContent: null }],
      });
      const { contextSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);

      expect(contextSnapshot.customMemories).toEqual([
        { id: 'cm-1', name: 'Internal glossary', content: 'ETL = extract...' },
      ]);
      expect(contextSnapshot.customSkills[0].name).toBe('deploy-helper');
      expect(contextSnapshot.customSkills[0].content).toBe('https://x');
    });
  });
});
