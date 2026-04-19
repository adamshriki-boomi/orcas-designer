import {
  BUILT_IN_RESEARCH_METHODS,
  RESEARCHER_WIZARD_STEPS,
  RESEARCHER_TOTAL_STEPS,
  RESEARCHER_STEP_GROUPS,
  RESEARCH_TYPE_INFO,
  getMethodsForProjectType,
  getMethodById,
} from './researcher-constants';
import type { ResearchProjectType } from './researcher-types';

describe('BUILT_IN_RESEARCH_METHODS', () => {
  it('has exactly 15 methods', () => {
    expect(BUILT_IN_RESEARCH_METHODS).toHaveLength(15);
  });

  it('has unique IDs for all methods', () => {
    const ids = BUILT_IN_RESEARCH_METHODS.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all methods have required fields', () => {
    for (const method of BUILT_IN_RESEARCH_METHODS) {
      expect(method.id).toBeTruthy();
      expect(method.name).toBeTruthy();
      expect(method.mode).toMatch(/^(generative|analytical)$/);
      expect(method.projectTypes.length).toBeGreaterThan(0);
      expect(method.description).toBeTruthy();
      expect(method.shortDescription).toBeTruthy();
      expect(method.requiredInputs.length).toBeGreaterThan(0);
      expect(method.outputFormat).toBeTruthy();
      expect(method.icon).toBeTruthy();
    }
  });

  it('generative-mode methods do not require dataUpload', () => {
    const generativeMethods = BUILT_IN_RESEARCH_METHODS.filter(m => m.mode === 'generative');
    for (const method of generativeMethods) {
      expect(method.requiredInputs).not.toContain('dataUpload');
    }
  });

  it('analytical-mode methods require dataUpload', () => {
    const analyticalMethods = BUILT_IN_RESEARCH_METHODS.filter(m => m.mode === 'analytical');
    expect(analyticalMethods.length).toBe(3);
    for (const method of analyticalMethods) {
      expect(method.requiredInputs).toContain('dataUpload');
    }
  });

  it('every method has at least one projectType', () => {
    for (const method of BUILT_IN_RESEARCH_METHODS) {
      expect(method.projectTypes.length).toBeGreaterThan(0);
      for (const pt of method.projectTypes) {
        expect(['exploratory', 'generative', 'evaluative']).toContain(pt);
      }
    }
  });

  it('research-plan and activity-protocol support all 3 project types', () => {
    const researchPlan = BUILT_IN_RESEARCH_METHODS.find(m => m.id === 'research-plan');
    const activityProtocol = BUILT_IN_RESEARCH_METHODS.find(m => m.id === 'activity-protocol');

    expect(researchPlan).toBeDefined();
    expect(activityProtocol).toBeDefined();

    const allTypes: ResearchProjectType[] = ['exploratory', 'generative', 'evaluative'];
    expect(researchPlan!.projectTypes).toEqual(expect.arrayContaining(allTypes));
    expect(activityProtocol!.projectTypes).toEqual(expect.arrayContaining(allTypes));
  });

  it('has 12 generative-mode and 3 analytical-mode methods', () => {
    const generative = BUILT_IN_RESEARCH_METHODS.filter(m => m.mode === 'generative');
    const analytical = BUILT_IN_RESEARCH_METHODS.filter(m => m.mode === 'analytical');
    expect(generative).toHaveLength(12);
    expect(analytical).toHaveLength(3);
  });
});

describe('getMethodsForProjectType', () => {
  it('returns correct methods for evaluative type', () => {
    const methods = getMethodsForProjectType('evaluative');
    expect(methods.length).toBeGreaterThan(0);
    for (const method of methods) {
      expect(method.projectTypes).toContain('evaluative');
    }
  });

  it('returns correct methods for exploratory type', () => {
    const methods = getMethodsForProjectType('exploratory');
    expect(methods.length).toBeGreaterThan(0);
    for (const method of methods) {
      expect(method.projectTypes).toContain('exploratory');
    }
  });

  it('returns correct methods for generative type', () => {
    const methods = getMethodsForProjectType('generative');
    expect(methods.length).toBeGreaterThan(0);
    for (const method of methods) {
      expect(method.projectTypes).toContain('generative');
    }
  });

  it('evaluative has the most methods', () => {
    const evaluative = getMethodsForProjectType('evaluative');
    const exploratory = getMethodsForProjectType('exploratory');
    const generative = getMethodsForProjectType('generative');
    expect(evaluative.length).toBeGreaterThanOrEqual(exploratory.length);
    expect(evaluative.length).toBeGreaterThanOrEqual(generative.length);
  });
});

describe('getMethodById', () => {
  it('returns method for valid ID', () => {
    const method = getMethodById('heuristic-evaluation');
    expect(method).toBeDefined();
    expect(method!.name).toBe('Heuristic Evaluation');
  });

  it('returns undefined for invalid ID', () => {
    expect(getMethodById('nonexistent')).toBeUndefined();
  });
});

describe('RESEARCHER_WIZARD_STEPS', () => {
  it('has exactly 9 entries', () => {
    expect(RESEARCHER_WIZARD_STEPS).toHaveLength(9);
  });

  it('RESEARCHER_TOTAL_STEPS matches length', () => {
    expect(RESEARCHER_TOTAL_STEPS).toBe(RESEARCHER_WIZARD_STEPS.length);
  });

  it('has unique keys', () => {
    const keys = RESEARCHER_WIZARD_STEPS.map(s => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('first step is research-type', () => {
    expect(RESEARCHER_WIZARD_STEPS[0].key).toBe('research-type');
  });

  it('last step is review-run', () => {
    expect(RESEARCHER_WIZARD_STEPS[RESEARCHER_WIZARD_STEPS.length - 1].key).toBe('review-run');
  });

  it('required steps are marked correctly', () => {
    const requiredKeys = RESEARCHER_WIZARD_STEPS.filter(s => s.required).map(s => s.key);
    expect(requiredKeys).toContain('research-type');
    expect(requiredKeys).toContain('product-context');
    expect(requiredKeys).toContain('research-purpose');
    expect(requiredKeys).toContain('target-audience');
    expect(requiredKeys).toContain('method-selection');
  });
});

describe('RESEARCHER_STEP_GROUPS', () => {
  it('covers all step indices without gaps', () => {
    const allIndices = new Set<number>();
    for (const group of RESEARCHER_STEP_GROUPS) {
      const [start, end] = group.range;
      for (let i = start; i <= end; i++) {
        expect(allIndices.has(i)).toBe(false); // no overlap
        allIndices.add(i);
      }
    }
    // All indices from 0 to TOTAL_STEPS-1 should be covered
    for (let i = 0; i < RESEARCHER_TOTAL_STEPS; i++) {
      expect(allIndices.has(i)).toBe(true);
    }
  });

  it('has 3 groups', () => {
    expect(RESEARCHER_STEP_GROUPS).toHaveLength(3);
  });

  it('group labels are Context, Research Setup, Configuration', () => {
    expect(RESEARCHER_STEP_GROUPS.map(g => g.label)).toEqual([
      'Context',
      'Research Setup',
      'Configuration',
    ]);
  });
});

describe('RESEARCH_TYPE_INFO', () => {
  it('has entries for all 3 types', () => {
    expect(RESEARCH_TYPE_INFO.exploratory).toBeDefined();
    expect(RESEARCH_TYPE_INFO.generative).toBeDefined();
    expect(RESEARCH_TYPE_INFO.evaluative).toBeDefined();
  });

  it('each entry has label and description', () => {
    for (const info of Object.values(RESEARCH_TYPE_INFO)) {
      expect(info.label).toBeTruthy();
      expect(info.description).toBeTruthy();
    }
  });
});
