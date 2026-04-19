import { renderHook, act } from '@testing-library/react';
import { useResearcherForm } from './use-researcher-form';
import { emptyResearcherProject } from '@/lib/researcher-types';
import {
  createTestResearcherProject,
  createTestResearcherConfig,
} from '@/test/helpers/researcher-fixtures';
import type { CustomSkill, CustomMemory } from '@/lib/types';

describe('useResearcherForm', () => {
  it('returns initial state matching emptyResearcherProject defaults', () => {
    const { result } = renderHook(() => useResearcherForm());
    const defaults = result.current.formData;

    expect(defaults.id).toBe('');
    expect(defaults.name).toBe('');
    expect(defaults.status).toBe('draft');
    expect(defaults.researchType).toBe('evaluative');
    expect(defaults.config.productContext.companyAdditionalContext).toBe('');
    expect(defaults.config.productContext.productInfo.textValue).toBe('');
    expect(defaults.config.productContext.featureInfo.textValue).toBe('');
    expect(defaults.config.productContext.additionalContext.textValue).toBe('');
    expect(defaults.config.researchPurpose.title).toBe('');
    expect(defaults.config.researchPurpose.description).toBe('');
    expect(defaults.config.researchPurpose.goals).toEqual([]);
    expect(defaults.config.targetAudience.description).toBe('');
    expect(defaults.config.targetAudience.segments).toEqual([]);
    expect(defaults.config.targetAudience.existingPersonas).toBe('');
    expect(defaults.config.successCriteria).toEqual([]);
    expect(defaults.config.dataUpload.files).toEqual([]);
    expect(defaults.config.dataUpload.textData).toBe('');
    expect(defaults.selectedMethodIds).toEqual([]);
    expect(defaults.selectedSharedSkillIds).toEqual([]);
    expect(defaults.customSkills).toEqual([]);
    expect(defaults.selectedSharedMemoryIds).toEqual(['built-in-company-context']);
    expect(defaults.customMemories).toEqual([]);
  });

  it('accepts a custom initialProject parameter', () => {
    const custom = createTestResearcherProject({
      name: 'Custom Research',
      researchType: 'generative',
    });
    const { result } = renderHook(() => useResearcherForm(custom));

    expect(result.current.formData.name).toBe('Custom Research');
    expect(result.current.formData.researchType).toBe('generative');
    expect(result.current.formData.id).toBe('test-research-id');
  });

  it('setName updates name', () => {
    const { result } = renderHook(() => useResearcherForm());

    act(() => {
      result.current.setName('My Research Project');
    });

    expect(result.current.formData.name).toBe('My Research Project');
  });

  it('setResearchType updates researchType', () => {
    const { result } = renderHook(() => useResearcherForm());

    act(() => {
      result.current.setResearchType('exploratory');
    });

    expect(result.current.formData.researchType).toBe('exploratory');
  });

  it('setProductContext updates config.productContext', () => {
    const { result } = renderHook(() => useResearcherForm());
    const ctx = {
      companyAdditionalContext: 'Boomi Inc.',
      productInfo: { inputType: 'text' as const, urlValue: '', textValue: 'Data Integration', files: [], additionalContext: '' },
      featureInfo: { inputType: 'text' as const, urlValue: '', textValue: 'Pipeline builder', files: [], additionalContext: '' },
      additionalContext: { inputType: 'text' as const, urlValue: '', textValue: 'Recently acquired', files: [], additionalContext: '' },
    };

    act(() => {
      result.current.setProductContext(ctx);
    });

    expect(result.current.formData.config.productContext).toEqual(ctx);
  });

  it('setResearchPurpose updates config.researchPurpose', () => {
    const { result } = renderHook(() => useResearcherForm());
    const purpose = {
      title: 'Usability Study',
      description: 'Evaluate pipeline builder',
      goals: ['Find pain points', 'Measure completion rates'],
    };

    act(() => {
      result.current.setResearchPurpose(purpose);
    });

    expect(result.current.formData.config.researchPurpose).toEqual(purpose);
  });

  it('setTargetAudience updates config.targetAudience', () => {
    const { result } = renderHook(() => useResearcherForm());
    const audience = {
      description: 'Data engineers',
      segments: ['data-engineers', 'data-analysts'],
      existingPersonas: 'Dana the Data Engineer',
    };

    act(() => {
      result.current.setTargetAudience(audience);
    });

    expect(result.current.formData.config.targetAudience).toEqual(audience);
  });

  it('setSuccessCriteria updates config.successCriteria', () => {
    const { result } = renderHook(() => useResearcherForm());
    const criteria = [
      { metric: 'Task completion rate', target: '> 85%' },
      { metric: 'SUS score', target: '> 72' },
    ];

    act(() => {
      result.current.setSuccessCriteria(criteria);
    });

    expect(result.current.formData.config.successCriteria).toEqual(criteria);
  });

  it('setSelectedMethods updates selectedMethodIds', () => {
    const { result } = renderHook(() => useResearcherForm());

    act(() => {
      result.current.setSelectedMethods(['heuristic-evaluation', 'task-analysis']);
    });

    expect(result.current.formData.selectedMethodIds).toEqual([
      'heuristic-evaluation',
      'task-analysis',
    ]);
  });

  it('setSelectedMethods prunes skill IDs that match removed method IDs', () => {
    const { result } = renderHook(() => useResearcherForm());

    act(() => {
      result.current.setSelectedMethods(['heuristic-evaluation', 'persona-development']);
      result.current.setSharedSkills(['heuristic-evaluation', 'persona-development', 'custom-uuid-skill']);
    });

    expect(result.current.formData.selectedSharedSkillIds).toContain('heuristic-evaluation');
    expect(result.current.formData.selectedSharedSkillIds).toContain('persona-development');
    expect(result.current.formData.selectedSharedSkillIds).toContain('custom-uuid-skill');

    act(() => {
      // Unselect heuristic-evaluation method
      result.current.setSelectedMethods(['persona-development']);
    });

    // heuristic-evaluation is removed from skills because it matched a removed method ID
    expect(result.current.formData.selectedSharedSkillIds).not.toContain('heuristic-evaluation');
    // persona-development stays because the method is still selected
    expect(result.current.formData.selectedSharedSkillIds).toContain('persona-development');
    // Unrelated custom skill stays
    expect(result.current.formData.selectedSharedSkillIds).toContain('custom-uuid-skill');
  });

  it('setDataUpload updates config.dataUpload', () => {
    const { result } = renderHook(() => useResearcherForm());
    const upload = {
      files: [{ id: 'f1', name: 'data.csv', mimeType: 'text/csv', size: 1024, url: 'https://example.com/data.csv' }],
      textData: 'Raw survey responses...',
    };

    act(() => {
      result.current.setDataUpload(upload);
    });

    expect(result.current.formData.config.dataUpload).toEqual(upload);
  });

  it('setSharedSkills updates selectedSharedSkillIds', () => {
    const { result } = renderHook(() => useResearcherForm());

    act(() => {
      result.current.setSharedSkills(['skill-1', 'skill-2']);
    });

    expect(result.current.formData.selectedSharedSkillIds).toEqual(['skill-1', 'skill-2']);
  });

  it('setCustomSkills updates customSkills', () => {
    const { result } = renderHook(() => useResearcherForm());
    const skills: CustomSkill[] = [
      { id: 'cs-1', name: 'My Skill', type: 'url', urlValue: 'https://example.com', fileContent: null },
    ];

    act(() => {
      result.current.setCustomSkills(skills);
    });

    expect(result.current.formData.customSkills).toEqual(skills);
  });

  it('setSharedMemories updates selectedSharedMemoryIds', () => {
    const { result } = renderHook(() => useResearcherForm());

    act(() => {
      result.current.setSharedMemories(['mem-1', 'mem-2']);
    });

    expect(result.current.formData.selectedSharedMemoryIds).toEqual(['mem-1', 'mem-2']);
  });

  it('setCustomMemories updates customMemories', () => {
    const { result } = renderHook(() => useResearcherForm());
    const memories: CustomMemory[] = [
      { id: 'cm-1', name: 'Custom Context', content: 'Important context' },
    ];

    act(() => {
      result.current.setCustomMemories(memories);
    });

    expect(result.current.formData.customMemories).toEqual(memories);
  });

  it('loadProject replaces entire state', () => {
    const { result } = renderHook(() => useResearcherForm());
    const project = createTestResearcherProject({
      name: 'Loaded Research',
      researchType: 'generative',
      status: 'completed',
      config: createTestResearcherConfig(),
      selectedMethodIds: ['heuristic-evaluation'],
    });

    act(() => {
      result.current.loadProject(project);
    });

    expect(result.current.formData.name).toBe('Loaded Research');
    expect(result.current.formData.researchType).toBe('generative');
    expect(result.current.formData.status).toBe('completed');
    expect(result.current.formData.id).toBe('test-research-id');
    expect(result.current.formData.selectedMethodIds).toEqual(['heuristic-evaluation']);
    expect(result.current.formData.config.productContext.companyAdditionalContext).toBe(
      'Boomi is an integration platform company.'
    );
  });

  it('multiple sequential updates accumulate correctly', () => {
    const { result } = renderHook(() => useResearcherForm());

    act(() => {
      result.current.setName('Updated Research');
    });
    act(() => {
      result.current.setResearchType('exploratory');
    });
    act(() => {
      result.current.setSelectedMethods(['persona-development']);
    });
    act(() => {
      result.current.setSharedSkills(['skill-a']);
    });

    expect(result.current.formData.name).toBe('Updated Research');
    expect(result.current.formData.researchType).toBe('exploratory');
    expect(result.current.formData.selectedMethodIds).toEqual(['persona-development']);
    expect(result.current.formData.selectedSharedSkillIds).toEqual(['skill-a']);
    // unchanged fields remain at defaults
    expect(result.current.formData.status).toBe('draft');
    expect(result.current.formData.selectedSharedMemoryIds).toEqual(['built-in-company-context']);
  });

  it('setting config fields does not affect other config sections', () => {
    const { result } = renderHook(() => useResearcherForm());

    act(() => {
      result.current.setProductContext({
        companyAdditionalContext: 'Acme',
        productInfo: { inputType: 'text' as const, urlValue: '', textValue: 'Widget', files: [], additionalContext: '' },
        featureInfo: { inputType: 'text' as const, urlValue: '', textValue: 'Button', files: [], additionalContext: '' },
        additionalContext: { inputType: 'text' as const, urlValue: '', textValue: '', files: [], additionalContext: '' },
      });
    });
    act(() => {
      result.current.setResearchPurpose({
        title: 'Test',
        description: 'A test',
        goals: ['goal-1'],
      });
    });

    // Both sections should be set independently
    expect(result.current.formData.config.productContext.companyAdditionalContext).toBe('Acme');
    expect(result.current.formData.config.researchPurpose.title).toBe('Test');
    // Other sections remain at defaults
    expect(result.current.formData.config.targetAudience.description).toBe('');
    expect(result.current.formData.config.successCriteria).toEqual([]);
  });
});
