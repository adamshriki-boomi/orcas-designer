'use client';

import { useReducer, useCallback } from 'react';
import type {
  Prompt,
  FormFieldData,
  CurrentImplementationData,
  FeatureDefinitionData,
  DesignProductsData,
  PromptMode,
  CustomSkill,
  SkillId,
  MemoryId,
  CustomMemory,
} from '@/lib/types';
import { emptyPrompt } from '@/lib/types';

type FormFieldKey =
  | 'companyInfo'
  | 'productInfo'
  | 'featureInfo'
  | 'uxResearch'
  | 'uxWriting'
  | 'prototypeSketches';

type WizardAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_FIELD'; payload: { field: FormFieldKey; data: FormFieldData } }
  | { type: 'SET_CURRENT_IMPL'; payload: CurrentImplementationData }
  | { type: 'SET_FEATURE_DEFINITION'; payload: FeatureDefinitionData }
  | { type: 'SET_DESIGN_PRODUCTS'; payload: DesignProductsData }
  | { type: 'SET_PROMPT_MODE'; payload: PromptMode }
  | { type: 'SET_SHARED_SKILLS'; payload: SkillId[] }
  | { type: 'SET_CUSTOM_SKILLS'; payload: CustomSkill[] }
  | { type: 'SET_SHARED_MEMORIES'; payload: MemoryId[] }
  | { type: 'SET_CUSTOM_MEMORIES'; payload: CustomMemory[] }
  | { type: 'LOAD_PROMPT'; payload: Prompt };

function wizardReducer(state: Prompt, action: WizardAction): Prompt {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.payload.field]: action.payload.data };
    case 'SET_CURRENT_IMPL':
      return { ...state, currentImplementation: action.payload };
    case 'SET_FEATURE_DEFINITION':
      return { ...state, featureDefinition: action.payload };
    case 'SET_DESIGN_PRODUCTS':
      return { ...state, designProducts: action.payload };
    case 'SET_PROMPT_MODE':
      return { ...state, promptMode: action.payload };
    case 'SET_SHARED_SKILLS':
      return { ...state, selectedSharedSkillIds: action.payload };
    case 'SET_CUSTOM_SKILLS':
      return { ...state, customSkills: action.payload };
    case 'SET_SHARED_MEMORIES':
      return { ...state, selectedSharedMemoryIds: action.payload };
    case 'SET_CUSTOM_MEMORIES':
      return { ...state, customMemories: action.payload };
    case 'LOAD_PROMPT':
      return action.payload;
    default:
      return state;
  }
}

export function useWizardForm(initialProject?: Prompt) {
  const [formData, dispatch] = useReducer(
    wizardReducer,
    initialProject ?? emptyPrompt('', 'New Prompt')
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

  const setFeatureDefinition = useCallback((data: FeatureDefinitionData) => {
    dispatch({ type: 'SET_FEATURE_DEFINITION', payload: data });
  }, []);

  const setDesignProducts = useCallback((data: DesignProductsData) => {
    dispatch({ type: 'SET_DESIGN_PRODUCTS', payload: data });
  }, []);

  const setPromptMode = useCallback((mode: PromptMode) => {
    dispatch({ type: 'SET_PROMPT_MODE', payload: mode });
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

  const loadPrompt = useCallback((project: Prompt) => {
    dispatch({ type: 'LOAD_PROMPT', payload: project });
  }, []);

  return {
    formData,
    setName,
    setField,
    setCurrentImpl,
    setFeatureDefinition,
    setDesignProducts,
    setPromptMode,
    setSharedSkills,
    setCustomSkills,
    setSharedMemories,
    setCustomMemories,
    loadPrompt,
  };
}
