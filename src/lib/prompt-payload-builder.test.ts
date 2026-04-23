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
    it('produces all six wizardSnapshot section keys even when fields are empty', () => {
      const prompt = createTestPrompt();
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);

      expect(Object.keys(wizardSnapshot).sort()).toEqual(
        [
          'Company & Product',
          'Design Products',
          'Design System',
          'Feature Definition',
          'Feature Information',
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

    it('merges feature description, current state, UX research, and prototypes into Feature Information', () => {
      const prompt = createFullPrompt();
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      const state = wizardSnapshot['Feature Information'];

      expect(state).toContain('## Feature description / requirements doc');
      expect(state).toContain('## Existing app / current state');
      expect(state).toContain('## UX research findings');
      expect(state).toContain('## Prior prototypes or wireframes');
    });

    it('includes figmaLinks in the Feature Information section when present', () => {
      const prompt = createFullPrompt();
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      expect(wizardSnapshot['Feature Information']).toContain('Figma links:');
      expect(wizardSnapshot['Feature Information']).toMatch(/figma\.com/);
    });

    it('notes implementation mode in Feature Information', () => {
      const addOnTop = buildPromptGenerationPayload(
        createTestPrompt(),
        sharedSkills,
        sharedMemories,
      );
      expect(addOnTop.wizardSnapshot['Feature Information']).toContain('Add on top of existing app');
    });

    it('includes feature definition mode, name, and brief', () => {
      const prompt = createTestPrompt({
        featureDefinition: {
          mode: 'improvement',
          name: 'Checkout redesign',
          briefDescription: 'Rework the 3-step checkout flow.',
        },
      });
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      const section = wizardSnapshot['Feature Definition'];

      expect(section).toContain('Type: Improvement of existing feature');
      expect(section).toContain('Name: Checkout redesign');
      expect(section).toContain('Brief:');
      expect(section).toContain('Rework the 3-step checkout flow.');
    });

    it('includes design products and optional Figma destination', () => {
      const prompt = createTestPrompt({
        designProducts: {
          products: ['wireframe', 'animated-prototype'],
          figmaDestinationUrl: 'https://www.figma.com/design/dest/Dest',
        },
      });
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      const section = wizardSnapshot['Design Products'];

      expect(section).toContain('Lo-fi wireframe');
      expect(section).toContain('Animated prototype');
      expect(section).not.toContain('Hi-fi mockup');
      expect(section).toContain('Figma destination');
      expect(section).toContain('https://www.figma.com/design/dest/Dest');
    });

    it('omits Figma destination row when not set', () => {
      const prompt = createTestPrompt({
        designProducts: { products: ['wireframe'], figmaDestinationUrl: '' },
      });
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);
      expect(wizardSnapshot['Design Products']).not.toContain('Figma destination');
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

    it('does NOT include Deliverables & Constraints section (removed in Phase 4 realignment)', () => {
      const prompt = createTestPrompt();
      const { wizardSnapshot } = buildPromptGenerationPayload(prompt, sharedSkills, sharedMemories);

      expect(Object.keys(wizardSnapshot)).not.toContain('Deliverables & Constraints');
      const allText = Object.values(wizardSnapshot).join('\n').toLowerCase();
      expect(allText).not.toContain('accessibility level:');
      expect(allText).not.toContain('browser compatibility:');
      expect(allText).not.toContain('output directory:');
      expect(allText).not.toContain('output type:');
      expect(allText).not.toContain('interaction level:');
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
