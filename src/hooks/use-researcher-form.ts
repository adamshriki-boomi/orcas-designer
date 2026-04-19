'use client';

import { useReducer, useCallback } from 'react';
import type {
  ResearcherProject,
  ResearcherConfig,
  ResearchProjectType,
} from '@/lib/researcher-types';
import { emptyResearcherProject } from '@/lib/researcher-types';
import type { SkillId, MemoryId, CustomSkill, CustomMemory } from '@/lib/types';

type ResearcherFormAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_RESEARCH_TYPE'; payload: ResearchProjectType }
  | { type: 'SET_PRODUCT_CONTEXT'; payload: ResearcherConfig['productContext'] }
  | { type: 'SET_RESEARCH_PURPOSE'; payload: ResearcherConfig['researchPurpose'] }
  | { type: 'SET_TARGET_AUDIENCE'; payload: ResearcherConfig['targetAudience'] }
  | { type: 'SET_SUCCESS_CRITERIA'; payload: ResearcherConfig['successCriteria'] }
  | { type: 'SET_SELECTED_METHODS'; payload: string[] }
  | { type: 'SET_DATA_UPLOAD'; payload: ResearcherConfig['dataUpload'] }
  | { type: 'SET_SHARED_SKILLS'; payload: SkillId[] }
  | { type: 'SET_CUSTOM_SKILLS'; payload: CustomSkill[] }
  | { type: 'SET_SHARED_MEMORIES'; payload: MemoryId[] }
  | { type: 'SET_CUSTOM_MEMORIES'; payload: CustomMemory[] }
  | { type: 'LOAD_PROJECT'; payload: ResearcherProject };

function researcherFormReducer(state: ResearcherProject, action: ResearcherFormAction): ResearcherProject {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_RESEARCH_TYPE':
      return { ...state, researchType: action.payload };
    case 'SET_PRODUCT_CONTEXT':
      return { ...state, config: { ...state.config, productContext: action.payload } };
    case 'SET_RESEARCH_PURPOSE':
      return { ...state, config: { ...state.config, researchPurpose: action.payload } };
    case 'SET_TARGET_AUDIENCE':
      return { ...state, config: { ...state.config, targetAudience: action.payload } };
    case 'SET_SUCCESS_CRITERIA':
      return { ...state, config: { ...state.config, successCriteria: action.payload } };
    case 'SET_SELECTED_METHODS': {
      const newMethodIds = action.payload;
      const previousMethodIds = state.selectedMethodIds;
      const removedMethodIds = previousMethodIds.filter((id) => !newMethodIds.includes(id));
      const prunedSkillIds = state.selectedSharedSkillIds.filter((id) => !removedMethodIds.includes(id));
      return {
        ...state,
        selectedMethodIds: newMethodIds,
        selectedSharedSkillIds: prunedSkillIds,
      };
    }
    case 'SET_DATA_UPLOAD':
      return { ...state, config: { ...state.config, dataUpload: action.payload } };
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

export function useResearcherForm(initialProject?: ResearcherProject) {
  const [formData, dispatch] = useReducer(
    researcherFormReducer,
    initialProject ?? emptyResearcherProject('', '')
  );

  const setName = useCallback((name: string) => {
    dispatch({ type: 'SET_NAME', payload: name });
  }, []);

  const setResearchType = useCallback((researchType: ResearchProjectType) => {
    dispatch({ type: 'SET_RESEARCH_TYPE', payload: researchType });
  }, []);

  const setProductContext = useCallback((productContext: ResearcherConfig['productContext']) => {
    dispatch({ type: 'SET_PRODUCT_CONTEXT', payload: productContext });
  }, []);

  const setResearchPurpose = useCallback((researchPurpose: ResearcherConfig['researchPurpose']) => {
    dispatch({ type: 'SET_RESEARCH_PURPOSE', payload: researchPurpose });
  }, []);

  const setTargetAudience = useCallback((targetAudience: ResearcherConfig['targetAudience']) => {
    dispatch({ type: 'SET_TARGET_AUDIENCE', payload: targetAudience });
  }, []);

  const setSuccessCriteria = useCallback((successCriteria: ResearcherConfig['successCriteria']) => {
    dispatch({ type: 'SET_SUCCESS_CRITERIA', payload: successCriteria });
  }, []);

  const setSelectedMethods = useCallback((methodIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_METHODS', payload: methodIds });
  }, []);

  const setDataUpload = useCallback((dataUpload: ResearcherConfig['dataUpload']) => {
    dispatch({ type: 'SET_DATA_UPLOAD', payload: dataUpload });
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

  const loadProject = useCallback((project: ResearcherProject) => {
    dispatch({ type: 'LOAD_PROJECT', payload: project });
  }, []);

  return {
    formData,
    dispatch,
    setName,
    setResearchType,
    setProductContext,
    setResearchPurpose,
    setTargetAudience,
    setSuccessCriteria,
    setSelectedMethods,
    setDataUpload,
    setSharedSkills,
    setCustomSkills,
    setSharedMemories,
    setCustomMemories,
    loadProject,
  };
}
