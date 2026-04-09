'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardForm } from '@/hooks/use-wizard-form';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import { useSharedMemories, COMPANY_CONTEXT_MEMORY_ID, PRODUCT_CONTEXT_MEMORY_IDS, DESIGN_SYSTEM_MEMORY_IDS, UX_WRITING_MEMORY_IDS } from '@/hooks/use-shared-memories';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { projectToRow } from '@/hooks/use-projects';
import { generateId } from '@/lib/id';
import { generatePrompt } from '@/lib/prompt-generator';
import { isFieldFilled } from '@/lib/validators';
import { WIZARD_STEPS, TOTAL_STEPS, BUILT_IN_COMPANY_CONTEXT } from '@/lib/constants';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { StepCompanyInfo } from '@/components/wizard/step-company-info';
import { StepProductInfo } from '@/components/wizard/step-product-info';
import { StepFeatureInfo } from '@/components/wizard/step-feature-info';
import { StepCurrentImpl } from '@/components/wizard/step-current-impl';
import { StepFigmaLink } from '@/components/wizard/step-figma-link';
import { StepDesignSystemStorybook } from '@/components/wizard/step-design-system-storybook';
import { StepDesignSystemNpm } from '@/components/wizard/step-design-system-npm';
import { StepDesignSystemFigma } from '@/components/wizard/step-design-system-figma';
import { StepUxResearch } from '@/components/wizard/step-ux-research';
import { StepUxWriting } from '@/components/wizard/step-ux-writing';
import { StepPrototypes } from '@/components/wizard/step-prototypes';
import { StepOutputType } from '@/components/wizard/step-output-type';
import { StepAdvancedOptions } from '@/components/wizard/step-advanced-options';
import { StepSkills } from '@/components/wizard/step-skills';
import { StepMemories } from '@/components/wizard/step-memories';
import { StepReview } from '@/components/wizard/step-review';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import type { FormFieldData } from '@/lib/types';
import { Suspense } from 'react';

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const currentStep = Number(searchParams.get('step') ?? '0');
  const { sharedSkills } = useSharedSkills();
  const { sharedMemories } = useSharedMemories();
  const { copied, copy } = useCopyToClipboard();

  const {
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
  } = useWizardForm();

  const setStep = useCallback(
    (step: number) => {
      router.replace(`/projects/new?step=${step}`);
    },
    [router]
  );

  const { canProceed, validationMessage } = (() => {
    const step = WIZARD_STEPS[currentStep];
    if (!step?.required) return { canProceed: true, validationMessage: null };
    switch (currentStep) {
      case 1: {
        const ok = isFieldFilled(formData.productInfo) || (formData.selectedSharedMemoryIds ?? []).some((id) => PRODUCT_CONTEXT_MEMORY_IDS.includes(id));
        return { canProceed: ok, validationMessage: ok ? null : 'Add product info or select a product context memory to continue' };
      }
      case 2: {
        const ok = isFieldFilled(formData.featureInfo);
        return { canProceed: ok, validationMessage: ok ? null : 'Add feature details to continue' };
      }
      case 11: {
        const ok = !!formData.interactionLevel;
        return { canProceed: ok, validationMessage: ok ? null : 'Select an interaction level to continue' };
      }
      default: return { canProceed: true, validationMessage: null };
    }
  })();

  const completedSteps = useMemo(() => {
    const set = new Set<number>();
    set.add(0); // Always completed — "Boomi Context" is locked/always included
    if (isFieldFilled(formData.productInfo) || (formData.selectedSharedMemoryIds ?? []).some((id) => PRODUCT_CONTEXT_MEMORY_IDS.includes(id))) set.add(1);
    if (isFieldFilled(formData.featureInfo)) set.add(2);
    if (isFieldFilled(formData.currentImplementation) || formData.currentImplementation.figmaLinks.length > 0) set.add(3);
    if (isFieldFilled(formData.uxResearch)) set.add(4);
    if (isFieldFilled(formData.uxWriting) || (formData.selectedSharedMemoryIds ?? []).some((id) => UX_WRITING_MEMORY_IDS.includes(id))) set.add(5);
    if (formData.figmaFileLink.urlValue.trim().length > 0) set.add(6);
    if (isFieldFilled(formData.designSystemStorybook) || (formData.selectedSharedMemoryIds ?? []).some((id) => DESIGN_SYSTEM_MEMORY_IDS.includes(id))) set.add(7);
    if (isFieldFilled(formData.designSystemNpm)) set.add(8);
    if (isFieldFilled(formData.designSystemFigma)) set.add(9);
    if (isFieldFilled(formData.prototypeSketches)) set.add(10);
    if (formData.interactionLevel) set.add(11);
    // Advanced options — completed if any non-default value is set
    if (
      formData.accessibilityLevel !== 'none' ||
      formData.browserCompatibility.length > 1 ||
      !formData.externalResourcesAccessible ||
      formData.designDirection !== null
    ) set.add(12);
    set.add(13); // Always completed — mandatory skills are always included
    if ((formData.selectedSharedMemoryIds?.length ?? 0) > 0 || (formData.customMemories?.length ?? 0) > 0) set.add(14);
    if (formData.generatedPrompt) set.add(15);
    return set;
  }, [formData]);

  const handleSave = async () => {
    try {
      const id = generateId();
      const projectData = { ...formData, id, name: formData.name || 'Untitled Project' };
      const prompt = generatePrompt(projectData, sharedSkills, sharedMemories);
      const fullProject = { ...projectData, generatedPrompt: prompt };
      const row = projectToRow(fullProject, user!.id);
      row.id = id;
      row.data = {
        companyInfo: fullProject.companyInfo,
        productInfo: fullProject.productInfo,
        featureInfo: fullProject.featureInfo,
        currentImplementation: fullProject.currentImplementation,
        uxResearch: fullProject.uxResearch,
        uxWriting: fullProject.uxWriting,
        figmaFileLink: fullProject.figmaFileLink,
        designSystemStorybook: fullProject.designSystemStorybook,
        designSystemNpm: fullProject.designSystemNpm,
        designSystemFigma: fullProject.designSystemFigma,
        prototypeSketches: fullProject.prototypeSketches,
      };
      const supabase = createClient();
      const { error } = await supabase.from('projects').insert(row as never);
      if (error) throw error;
      toast.success('Project saved');
      router.push(`/projects/placeholder?_id=${encodeURIComponent(id)}`);
    } catch {
      toast.error('Unable to save project');
    }
  };

  const handleCopy = async () => {
    try {
      const prompt = generatePrompt(formData, sharedSkills, sharedMemories);
      await copy(prompt);
      toast.success('Prompt copied');
    } catch {
      toast.error('Unable to copy prompt');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepCompanyInfo data={formData.companyInfo} onChange={(d: FormFieldData) => setField('companyInfo', d)} builtInContent={BUILT_IN_COMPANY_CONTEXT} />;
      case 1: {
        const productMemories = sharedMemories.filter((m) => PRODUCT_CONTEXT_MEMORY_IDS.includes(m.id));
        return (
          <StepProductInfo
            data={formData.productInfo}
            onChange={(d: FormFieldData) => setField('productInfo', d)}
            productMemories={productMemories}
            selectedMemoryIds={formData.selectedSharedMemoryIds ?? []}
            onSelectedMemoryIdsChange={setSharedMemories}
          />
        );
      }
      case 2:
        return <StepFeatureInfo data={formData.featureInfo} onChange={(d: FormFieldData) => setField('featureInfo', d)} />;
      case 3:
        return <StepCurrentImpl data={formData.currentImplementation} onChange={setCurrentImpl} />;
      case 4:
        return <StepUxResearch data={formData.uxResearch} onChange={(d: FormFieldData) => setField('uxResearch', d)} />;
      case 5: {
        const uxWritingMemories = sharedMemories.filter((m) => UX_WRITING_MEMORY_IDS.includes(m.id));
        return (
          <StepUxWriting
            data={formData.uxWriting}
            onChange={(d: FormFieldData) => setField('uxWriting', d)}
            uxWritingMemories={uxWritingMemories}
            selectedMemoryIds={formData.selectedSharedMemoryIds ?? []}
            onSelectedMemoryIdsChange={setSharedMemories}
          />
        );
      }
      case 6:
        return <StepFigmaLink data={formData.figmaFileLink} onChange={(d: FormFieldData) => setField('figmaFileLink', d)} />;
      case 7: {
        const storybookMemories = sharedMemories.filter((m) => DESIGN_SYSTEM_MEMORY_IDS.includes(m.id));
        return (
          <StepDesignSystemStorybook
            data={formData.designSystemStorybook}
            onChange={(d: FormFieldData) => setField('designSystemStorybook', d)}
            storybookMemories={storybookMemories}
            selectedMemoryIds={formData.selectedSharedMemoryIds ?? []}
            onSelectedMemoryIdsChange={setSharedMemories}
          />
        );
      }
      case 8:
        return <StepDesignSystemNpm data={formData.designSystemNpm} onChange={(d: FormFieldData) => setField('designSystemNpm', d)} />;
      case 9:
        return <StepDesignSystemFigma data={formData.designSystemFigma} onChange={(d: FormFieldData) => setField('designSystemFigma', d)} />;
      case 10:
        return <StepPrototypes data={formData.prototypeSketches} onChange={(d: FormFieldData) => setField('prototypeSketches', d)} />;
      case 11:
        return (
          <StepOutputType
            interactionLevel={formData.interactionLevel}
            onInteractionLevelChange={setInteractionLevel}
            outputDirectory={formData.outputDirectory}
            onOutputDirectoryChange={setOutputDirectory}
            promptMode={formData.promptMode}
            onPromptModeChange={setPromptMode}
          />
        );
      case 12:
        return (
          <StepAdvancedOptions
            accessibilityLevel={formData.accessibilityLevel}
            onAccessibilityLevelChange={setAccessibilityLevel}
            browserCompatibility={formData.browserCompatibility}
            onBrowserCompatChange={setBrowserCompat}
            externalResourcesAccessible={formData.externalResourcesAccessible}
            onExternalResourcesChange={setExternalResources}
            designDirection={formData.designDirection}
            onDesignDirectionChange={setDesignDirection}
          />
        );
      case 13:
        return (
          <StepSkills
            formData={formData}
            selectedSharedSkillIds={formData.selectedSharedSkillIds}
            onSharedSkillsChange={setSharedSkills}
            customSkills={formData.customSkills}
            onCustomSkillsChange={setCustomSkills}
            sharedSkills={sharedSkills}
          />
        );
      case 14:
        return (
          <StepMemories
            sharedMemories={sharedMemories}
            selectedSharedMemoryIds={formData.selectedSharedMemoryIds ?? []}
            onSharedMemoriesChange={setSharedMemories}
            customMemories={formData.customMemories ?? []}
            onCustomMemoriesChange={setCustomMemories}
            lockedMemoryIds={[COMPANY_CONTEXT_MEMORY_ID]}
          />
        );
      case 15:
        return <StepReview formData={formData} sharedSkills={sharedSkills} sharedMemories={sharedMemories} onCopy={handleCopy} copied={copied} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Header title="New Project" description="Set up your design prompt" />
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: 'New Project' },
      ]} />
      <PageContainer wide>
        <div className="mb-6 max-w-md">
          <Input
            label="Project Name"
            type="text"
            value={formData.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Feature Design"
          />
        </div>
        <WizardShell
          currentStep={currentStep}
          onStepChange={setStep}
          canProceed={canProceed}
          validationMessage={validationMessage}
          onSave={handleSave}
          completedSteps={completedSteps}
        >
          {renderStep()}
        </WizardShell>
      </PageContainer>
    </>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <WizardContent />
    </Suspense>
  );
}
