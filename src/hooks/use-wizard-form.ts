'use client';

import { useReducer, useCallback } from 'react';
import type {
  Project,
  FormFieldData,
  CurrentImplementationData,
  OutputType,
  InteractionLevel,
  AccessibilityLevel,
  BrowserTarget,
  PromptMode,
  DesignDirection,
  CustomSkill,
  SkillId,
  MemoryId,
  CustomMemory,
} from '@/lib/types';
import { emptyProject } from '@/lib/types';

type FormFieldKey =
  | 'companyInfo'
  | 'productInfo'
  | 'featureInfo'
  | 'uxResearch'
  | 'figmaFileLink'
  | 'designSystemStorybook'
  | 'designSystemNpm'
  | 'designSystemFigma'
  | 'prototypeSketches';

type WizardAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_FIELD'; payload: { field: FormFieldKey; data: FormFieldData } }
  | { type: 'SET_CURRENT_IMPL'; payload: CurrentImplementationData }
  | { type: 'SET_OUTPUT_TYPE'; payload: OutputType }
  | { type: 'SET_INTERACTION_LEVEL'; payload: InteractionLevel }
  | { type: 'SET_OUTPUT_DIRECTORY'; payload: string }
  | { type: 'SET_PROMPT_MODE'; payload: PromptMode }
  | { type: 'SET_ACCESSIBILITY_LEVEL'; payload: AccessibilityLevel }
  | { type: 'SET_BROWSER_COMPAT'; payload: BrowserTarget[] }
  | { type: 'SET_EXTERNAL_RESOURCES'; payload: boolean }
  | { type: 'SET_DESIGN_DIRECTION'; payload: DesignDirection | null }
  | { type: 'SET_SHARED_SKILLS'; payload: SkillId[] }
  | { type: 'SET_CUSTOM_SKILLS'; payload: CustomSkill[] }
  | { type: 'SET_SHARED_MEMORIES'; payload: MemoryId[] }
  | { type: 'SET_CUSTOM_MEMORIES'; payload: CustomMemory[] }
  | { type: 'LOAD_PROJECT'; payload: Project };

function wizardReducer(state: Project, action: WizardAction): Project {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.data };
    case 'SET_CURRENT_IMPL':
      return { ...state, currentImplementation: action.payload };
    case 'SET_OUTPUT_TYPE':
      return { ...state, outputType: action.payload };
    case 'SET_INTERACTION_LEVEL':
      return { ...state, interactionLevel: action.payload };
    case 'SET_OUTPUT_DIRECTORY':
      return { ...state, outputDirectory: action.payload };
    case 'SET_PROMPT_MODE':
      return { ...state, promptMode: action.payload };
    case 'SET_ACCESSIBILITY_LEVEL':
      return { ...state, accessibilityLevel: action.payload };
    case 'SET_BROWSER_COMPAT':
      return { ...state, browserCompatibility: action.payload };
    case 'SET_EXTERNAL_RESOURCES':
      return { ...state, externalResourcesAccessible: action.payload };
    case 'SET_DESIGN_DIRECTION':
      return { ...state, designDirection: action.payload };
    case 'SET_SHARED_SKILLS':
      return { ...state, selectedSharedSkillIds: action.payload };
    case 'SET_CUSTOM_SKILLS':
      return { ...state, customSkills: action.payload };
    case 'SET_SHARED_MEMORIES':
      return { ...state, selectedSharedMemoryIds: action.payload };
    case 'SET_CUSTOM_MEMORIES':
      return { ...state, customMemories: action.payload };
    case 'LOAD_PROJECT':
      return action.payload;
    default:
      return state;
  }
}

export function useWizardForm(initialProject?: Project) {
  const [formData, dispatch] = useReducer(
    wizardReducer,
    initialProject ?? emptyProject('', 'New Project')
  );

  const setName = useCallback((name: string) => {
    dispatch({ type: 'SET_NAME', payload: name });
  }, []);

  const setField = useCallback((field: FormFieldKey, data: FormFieldData) => {
    dispatch({ type: 'SET_FIELD', payload: { field, data } });
  }, []);

  const setCurrentImpl = useCallback((data: CurrentImplementationData) => {
    dispatch({ type: 'SET_CURRENT_IMPL', payload: data });
  }, []);

  const setOutputType = useCallback((outputType: OutputType) => {
    dispatch({ type: 'SET_OUTPUT_TYPE', payload: outputType });
  }, []);

  const setInteractionLevel = useCallback((level: InteractionLevel) => {
    dispatch({ type: 'SET_INTERACTION_LEVEL', payload: level });
  }, []);

  const setOutputDirectory = useCallback((dir: string) => {
    dispatch({ type: 'SET_OUTPUT_DIRECTORY', payload: dir });
  }, []);

  const setPromptMode = useCallback((mode: PromptMode) => {
    dispatch({ type: 'SET_PROMPT_MODE', payload: mode });
  }, []);

  const setAccessibilityLevel = useCallback((level: AccessibilityLevel) => {
    dispatch({ type: 'SET_ACCESSIBILITY_LEVEL', payload: level });
  }, []);

  const setBrowserCompat = useCallback((browsers: BrowserTarget[]) => {
    dispatch({ type: 'SET_BROWSER_COMPAT', payload: browsers });
  }, []);

  const setExternalResources = useCallback((accessible: boolean) => {
    dispatch({ type: 'SET_EXTERNAL_RESOURCES', payload: accessible });
  }, []);

  const setDesignDirection = useCallback((dd: DesignDirection | null) => {
    dispatch({ type: 'SET_DESIGN_DIRECTION', payload: dd });
  }, []);

  const setSharedSkills = useCallback((ids: SkillId[]) => {
    dispatch({ type: 'SET_SHARED_SKILLS', payload: ids });
  }, []);

  const setCustomSkills = useCallback((skills: CustomSkill[]) => {
    dispatch({ type: 'SET_CUSTOM_SKILLS', payload: skills });
  }, []);

  const setSharedMemories = useCallback((ids: MemoryId[]) => {
    dispatch({ type: 'SET_SHARED_MEMORIES', payload: ids });
  }, []);

  const setCustomMemories = useCallback((memories: CustomMemory[]) => {
    dispatch({ type: 'SET_CUSTOM_MEMORIES', payload: memories });
  }, []);

  const loadProject = useCallback((project: Project) => {
    dispatch({ type: 'LOAD_PROJECT', payload: project });
  }, []);

  return {
    formData,
    setName,
    setField,
    setCurrentImpl,
    setOutputType,
    setInteractionLevel,
    setOutputDirectory,
    setPromptMode,
    setAccessibilityLevel,
    setBrowserCompat,
    setExternalResources,
    setDesignDirection,
    setSharedSkills,
    setCustomSkills,
    setSharedMemories,
    setCustomMemories,
    loadProject,
  };
}
